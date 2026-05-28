'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import BudgetPlanDocument from '@/components/budget/BudgetPlanDocument'
import BudgetExportSubjectSelect from '@/components/budget/BudgetExportSubjectSelect'
import {
  buildBudgetPlanExportInput,
  buildBudgetPlanScopesPayload,
} from '@/lib/budgetPlanExport/buildBudgetPlanExportInput'
import { buildBudgetPlanFilename } from '@/lib/budgetPlanExport/budgetPlanExportFilenames'
import { downloadBudgetPlanExcel } from '@/lib/budgetPlanExport/downloadBudgetPlanExcel'
import {
  getDefaultBudgetExportSubject,
  resolveBudgetExportScopes,
} from '@/lib/budgetPlanExport/resolveBudgetExportScopes'
import type { BudgetExportLayout, BudgetExportSubject } from '@/lib/budgetPlanExport/types'
import { BUDGET_MONTH_LABELS } from '@/lib/budgetPeriod'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import { buildFinanceViewYearOptions } from '@/lib/financeYearOptions'
import { useActivePersonFinance, useStore } from '@/lib/store'
import { ChevronLeft, FileDown, FileSpreadsheet, Loader2, Printer } from 'lucide-react'

export default function RapportBudsjettplanPage() {
  const {
    budgetYear,
    archivedBudgetsByYear,
    transactions,
    isHouseholdAggregate,
    profiles,
    activeProfileId,
  } = useActivePersonFinance()
  const people = useStore((s) => s.people)
  const uiColorPalette = useStore((s) => s.uiColorPalette)

  const [year, setYear] = useState(budgetYear)
  const [layout, setLayout] = useState<BudgetExportLayout>('fullYear')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [subject, setSubject] = useState<BudgetExportSubject>(() =>
    getDefaultBudgetExportSubject(isHouseholdAggregate, activeProfileId),
  )
  const [onlyLinesWithAmounts, setOnlyLinesWithAmounts] = useState(false)
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.dataset.printReport = 'true'
    return () => {
      delete document.body.dataset.printReport
    }
  }, [])

  useEffect(() => {
    setYear(budgetYear)
  }, [budgetYear])

  useEffect(() => {
    setSubject(getDefaultBudgetExportSubject(isHouseholdAggregate, activeProfileId))
  }, [isHouseholdAggregate, activeProfileId])

  const exportCtx = useMemo(
    () => ({
      people,
      profiles,
      isHouseholdAggregate,
      activeProfileId,
      budgetYear,
      exportYear: year,
      archivedBudgetsByYear,
    }),
    [people, profiles, isHouseholdAggregate, activeProfileId, budgetYear, year, archivedBudgetsByYear],
  )

  const yearOptions = useMemo(
    () =>
      buildFinanceViewYearOptions({
        budgetYear,
        transactions: transactions ?? [],
        archivedBudgetsByYear,
        selectedViewYear: year,
      }),
    [budgetYear, transactions, archivedBudgetsByYear, year],
  )

  useEffect(() => {
    if (!yearOptions.includes(year)) setYear(budgetYear)
  }, [yearOptions, year, budgetYear])

  const previewScopes = useMemo(
    () =>
      buildBudgetPlanScopesPayload({
        subject,
        ctx: exportCtx,
        year,
        layout,
        monthIndex,
        onlyLinesWithAmounts,
      }),
    [subject, exportCtx, year, layout, monthIndex, onlyLinesWithAmounts],
  )

  const canExport = useMemo(
    () => resolveBudgetExportScopes(subject, exportCtx).some((s) => s.categories.length > 0),
    [subject, exportCtx],
  )

  const handlePrint = () => {
    setGeneratedAt(new Date())
    requestAnimationFrame(() => {
      window.print()
    })
  }

  const handlePdf = useCallback(async () => {
    const el = reportRef.current
    if (!el || !canExport) return
    setPdfLoading(true)
    setGeneratedAt(new Date())
    try {
      await new Promise((r) => requestAnimationFrame(r))
      await exportBankReportPdf(
        el,
        buildBudgetPlanFilename({
          year,
          scopeLabel: previewScopes.length === 1 ? previewScopes[0].scopeLabel : 'Alle',
          subject,
          ext: 'pdf',
        }),
      )
    } finally {
      setPdfLoading(false)
    }
  }, [canExport, year, previewScopes, subject])

  const handleExcel = useCallback(async () => {
    if (!canExport) return
    setExcelLoading(true)
    try {
      const input = buildBudgetPlanExportInput({
        subject,
        ctx: exportCtx,
        year,
        layout,
        monthIndex,
        onlyLinesWithAmounts,
        generatedAt: new Date(),
      })
      await downloadBudgetPlanExcel(
        input,
        buildBudgetPlanFilename({
          year,
          scopeLabel: input.scopes.length === 1 ? input.scopes[0].label : 'Alle',
          subject,
          ext: 'xlsx',
        }),
      )
    } finally {
      setExcelLoading(false)
    }
  }, [canExport, subject, exportCtx, year, layout, monthIndex, onlyLinesWithAmounts])

  const btnClass =
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium touch-manipulation disabled:opacity-60'

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <div className="print-hidden">
        <Header title="Budsjettplan" subtitle="Eksporter planlagte inntekter og utgifter" />
        <div
          className="px-4 sm:px-8 py-4 border-b min-w-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col gap-3 min-w-0">
            <Link
              href="/rapporter"
              className="inline-flex items-center gap-1 text-sm font-medium min-h-[44px] w-fit touch-manipulation py-1"
              style={{ color: 'var(--primary)' }}
            >
              <ChevronLeft size={16} />
              Rapporter
            </Link>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-3 w-full min-w-0">
              <label
                className="flex min-w-0 flex-col gap-1 text-sm sm:min-w-[7.5rem]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>År</span>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full min-h-[44px] min-w-[7.5rem] rounded-xl px-3 text-sm touch-manipulation"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="flex min-w-0 flex-col gap-1 text-sm sm:min-w-[9rem]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Visning</span>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as BudgetExportLayout)}
                  className="w-full min-h-[44px] rounded-xl px-3 text-sm touch-manipulation"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  <option value="fullYear">Hele året</option>
                  <option value="singleMonth">Én måned</option>
                </select>
              </label>
              {layout === 'singleMonth' ? (
                <label
                  className="flex min-w-0 flex-col gap-1 text-sm sm:min-w-[9rem]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>Måned</span>
                  <select
                    value={monthIndex}
                    onChange={(e) => setMonthIndex(Number(e.target.value))}
                    className="w-full min-h-[44px] rounded-xl px-3 text-sm touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    {BUDGET_MONTH_LABELS.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <BudgetExportSubjectSelect
                value={subject}
                onChange={setSubject}
                isHouseholdAggregate={isHouseholdAggregate}
                profiles={profiles}
              />
              <label
                className="inline-flex items-center gap-2 min-h-[44px] text-sm cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <input
                  type="checkbox"
                  checked={onlyLinesWithAmounts}
                  onChange={(e) => setOnlyLinesWithAmounts(e.target.checked)}
                  className="h-4 w-4"
                />
                Kun linjer med beløp
              </label>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!canExport}
                  className={btnClass}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <Printer size={16} />
                  Skriv ut
                </button>
                <button
                  type="button"
                  onClick={() => void handlePdf()}
                  disabled={!canExport || pdfLoading}
                  className={btnClass}
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                  Eksporter PDF
                </button>
                <button
                  type="button"
                  onClick={() => void handleExcel()}
                  disabled={!canExport || excelLoading}
                  className={`${btnClass} hidden md:inline-flex`}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {excelLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={16} />
                  )}
                  Eksporter Excel
                </button>
              </div>
            </div>
            {!canExport ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ingen budsjettplan for {year} med valgt omfang.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-8" style={{ background: 'var(--bg)' }}>
        {canExport ? (
          <BudgetPlanDocument
            ref={reportRef}
            generatedAt={generatedAt}
            year={year}
            layout={layout}
            monthIndex={monthIndex}
            uiColorPalette={uiColorPalette}
            scopes={previewScopes}
          />
        ) : (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Velg et år med budsjettdata for forhåndsvisning.
          </div>
        )}
      </div>
    </div>
  )
}
