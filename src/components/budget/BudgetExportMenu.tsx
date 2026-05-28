'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import BudgetPlanDocument from '@/components/budget/BudgetPlanDocument'
import BudgetExportSubjectSelect from '@/components/budget/BudgetExportSubjectSelect'
import {
  buildBudgetPlanExportInput,
  buildBudgetPlanScopesPayload,
  hasBudgetPlanExportData,
} from '@/lib/budgetPlanExport/buildBudgetPlanExportInput'
import { buildBudgetPlanFilename } from '@/lib/budgetPlanExport/budgetPlanExportFilenames'
import { downloadBudgetPlanExcel } from '@/lib/budgetPlanExport/downloadBudgetPlanExcel'
import {
  getDefaultBudgetExportSubject,
  resolveBudgetExportScopes,
} from '@/lib/budgetPlanExport/resolveBudgetExportScopes'
import type { BudgetExportLayout, BudgetExportSubject } from '@/lib/budgetPlanExport/types'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import { useStore } from '@/lib/store'
import { Download, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'

type Props = {
  year: number
  layout: BudgetExportLayout
  monthIndex: number
  defaultSubject?: BudgetExportSubject
  onlyLinesWithAmounts?: boolean
  showSubjectSelect?: boolean
  variant?: 'toolbar' | 'report'
}

export default function BudgetExportMenu({
  year,
  layout,
  monthIndex,
  defaultSubject,
  onlyLinesWithAmounts = false,
  showSubjectSelect = true,
  variant = 'toolbar',
}: Props) {
  const { people, profiles, archivedBudgetsByYear, budgetYear, activeProfileId, uiColorPalette, isHouseholdAggregate } =
    useStore(
      useShallow((s) => ({
        people: s.people,
        profiles: s.profiles,
        archivedBudgetsByYear: s.archivedBudgetsByYear,
        budgetYear: s.budgetYear,
        activeProfileId: s.activeProfileId,
        uiColorPalette: s.uiColorPalette,
        isHouseholdAggregate:
          s.financeScope === 'household' && s.subscriptionPlan === 'family' && s.profiles.length >= 2,
      })),
    )

  const [subject, setSubject] = useState<BudgetExportSubject>(
    defaultSubject ?? getDefaultBudgetExportSubject(isHouseholdAggregate, activeProfileId),
  )
  const [pdfLoading, setPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [pdfMount, setPdfMount] = useState<{
    generatedAt: Date
    scopes: ReturnType<typeof buildBudgetPlanScopesPayload>
  } | null>(null)

  const pdfRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const root = menuRef.current
      if (root && !root.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

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

  const canExport = useMemo(
    () => hasBudgetPlanExportData(resolveBudgetExportScopes(subject, exportCtx)),
    [subject, exportCtx],
  )

  const btnClass =
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium touch-manipulation border disabled:opacity-40'

  const handleExportExcel = useCallback(async () => {
    if (!canExport) return
    setMenuOpen(false)
    setExportError(null)
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
      const scopeLabel = input.scopes.length === 1 ? input.scopes[0].label : 'Alle'
      await downloadBudgetPlanExcel(
        input,
        buildBudgetPlanFilename({ year, scopeLabel, subject, ext: 'xlsx' }),
      )
    } catch {
      setExportError('Kunne ikke eksportere Excel.')
    } finally {
      setExcelLoading(false)
    }
  }, [canExport, subject, exportCtx, year, layout, monthIndex, onlyLinesWithAmounts])

  const handleExportPdf = useCallback(async () => {
    if (!canExport) return
    setMenuOpen(false)
    setExportError(null)
    setPdfLoading(true)
    const generatedAt = new Date()
    const scopes = buildBudgetPlanScopesPayload({
      subject,
      ctx: exportCtx,
      year,
      layout,
      monthIndex,
      onlyLinesWithAmounts,
    })
    setPdfMount({ generatedAt, scopes })
    try {
      await new Promise((r) => requestAnimationFrame(r))
      await new Promise((r) => requestAnimationFrame(r))
      const el = pdfRef.current
      if (!el) throw new Error('missing pdf root')
      await exportBankReportPdf(
        el,
        buildBudgetPlanFilename({
          year,
          scopeLabel: scopes.length === 1 ? scopes[0].scopeLabel : 'Alle',
          subject,
          ext: 'pdf',
        }),
      )
    } catch {
      setExportError('Kunne ikke eksportere PDF.')
    } finally {
      setPdfMount(null)
      setPdfLoading(false)
    }
  }, [canExport, subject, exportCtx, year, layout, monthIndex, onlyLinesWithAmounts])

  const disabled = !canExport || pdfLoading || excelLoading

  const subjectSelect =
    showSubjectSelect && (isHouseholdAggregate || profiles.length > 1) ? (
      <BudgetExportSubjectSelect
        value={subject}
        onChange={setSubject}
        isHouseholdAggregate={isHouseholdAggregate}
        profiles={profiles}
      />
    ) : null

  const iconBtnClass =
    'inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl touch-manipulation shadow-sm disabled:opacity-40'

  const pdfButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void handleExportPdf()}
      className={btnClass}
      style={{ borderColor: 'var(--border)', background: 'var(--primary-pale)', color: 'var(--primary)' }}
      aria-label="Eksporter budsjettplan som PDF"
    >
      {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <FileDown className="h-4 w-4 shrink-0" />}
      {variant === 'report' ? <span>Eksporter PDF</span> : <span>PDF</span>}
    </button>
  )

  const excelButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void handleExportExcel()}
      className={`${btnClass} hidden md:inline-flex`}
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
      aria-label="Eksporter budsjettplan som Excel"
    >
      {excelLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 shrink-0" />
      )}
      {variant === 'report' ? <span>Eksporter Excel</span> : <span>Excel</span>}
    </button>
  )

  const exportMenuPanel = (
    <div
      className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl p-3 space-y-3 shadow-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {subjectSelect}
      <div className="flex flex-col gap-2">
        {pdfButton}
        {excelButton}
      </div>
      {!canExport ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Ingen budsjettplan for {year}.
        </p>
      ) : null}
      {exportError ? (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>
          {exportError}
        </p>
      ) : null}
    </div>
  )

  return (
    <>
      {variant === 'toolbar' ? (
        <div ref={menuRef} className="relative min-w-0">
          <button
            type="button"
            className={iconBtnClass}
            style={{
              background: 'var(--primary)',
              color: 'white',
              opacity: canExport ? 1 : 0.45,
            }}
            aria-label="Last ned budsjettplan"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            title="Last ned budsjettplan"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {pdfLoading || excelLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Download className="h-5 w-5" aria-hidden />
            )}
          </button>
          {menuOpen ? exportMenuPanel : null}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-end">
          {subjectSelect}
          {pdfButton}
          {excelButton}
        </div>
      )}

      {pdfMount ? (
        <div className="fixed -left-[9999px] top-0 w-[794px] pointer-events-none" aria-hidden>
          <BudgetPlanDocument
            ref={pdfRef}
            generatedAt={pdfMount.generatedAt}
            year={year}
            layout={layout}
            monthIndex={monthIndex}
            uiColorPalette={uiColorPalette}
            scopes={pdfMount.scopes}
          />
        </div>
      ) : null}
    </>
  )
}
