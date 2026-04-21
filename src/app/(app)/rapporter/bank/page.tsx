'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import BankReportDocument, {
  type BankReportSectionKey,
} from '@/components/reports/BankReportDocument'
import {
  buildBankReportIncomeDetail,
  buildBankReportKpis,
  buildBudgetVsActual,
  getMonthKey,
  groupBudgetVsActualByParent,
  sumIncomeExpenseNetThreeMonthWindow,
  sumTransactionsByCategoryForMonth,
} from '@/lib/bankReportData'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import {
  aggregateHouseholdData,
  createEmptyPersonData,
  useActivePersonFinance,
  useStore,
} from '@/lib/store'
import { ChevronLeft, FileDown, Printer } from 'lucide-react'

/** Husholdningsrapport: samlet eller én profil (profil-id). */
type BankReportSubject = 'household' | string

const MONTH_OPTIONS = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const SECTION_LABELS: Record<BankReportSectionKey, string> = {
  summary: 'Sammendrag (nøkkeltall)',
  debts: 'Gjeld',
  savings: 'Sparing',
  investments: 'Investeringer',
  budgetVs: 'Budsjett vs faktisk',
  freeText: 'Fritekst til saksbehandler',
  rolling3m: 'Tre måneder (snitt/transaksjoner)',
}

const DEFAULT_SECTIONS: Record<BankReportSectionKey, boolean> = {
  summary: true,
  debts: true,
  savings: true,
  investments: true,
  budgetVs: true,
  freeText: true,
  rolling3m: true,
}

export default function RapportBankPage() {
  const {
    transactions,
    budgetCategories,
    budgetYear,
    debts,
    savingsGoals,
    investments,
    activeProfileId,
    profiles,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const people = useStore((s) => s.people)

  const [reportSubject, setReportSubject] = useState<BankReportSubject>('household')

  const [year, setYear] = useState(budgetYear)
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [pdfLoading, setPdfLoading] = useState(false)
  const [sections, setSections] = useState<Record<BankReportSectionKey, boolean>>(() => ({
    ...DEFAULT_SECTIONS,
  }))
  const [freeTextSituation, setFreeTextSituation] = useState('')
  const [freeTextPurpose, setFreeTextPurpose] = useState('')

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
    if (!isHouseholdAggregate) return
    if (reportSubject === 'household') return
    if (!profiles.some((p) => p.id === reportSubject)) {
      setReportSubject('household')
    }
  }, [isHouseholdAggregate, profiles, reportSubject])

  const reportFinance = useMemo(() => {
    if (!isHouseholdAggregate) {
      return {
        transactions,
        budgetCategories,
        debts,
        savingsGoals,
        investments,
      }
    }
    if (reportSubject === 'household') {
      const profileIds = profiles.map((p) => p.id)
      return aggregateHouseholdData(people, profileIds, budgetYear)
    }
    return people[reportSubject] ?? createEmptyPersonData()
  }, [
    isHouseholdAggregate,
    reportSubject,
    transactions,
    budgetCategories,
    debts,
    savingsGoals,
    investments,
    people,
    profiles,
    budgetYear,
  ])

  const scopeLabel = useMemo(() => {
    if (!isHouseholdAggregate) {
      const name = profiles.find((p) => p.id === activeProfileId)?.name
      return name ?? 'Profil'
    }
    if (reportSubject === 'household') return 'Husholdning (alle profiler)'
    const name = profiles.find((p) => p.id === reportSubject)?.name
    return name ?? 'Profil'
  }, [isHouseholdAggregate, profiles, activeProfileId, reportSubject])

  const monthTotals = useMemo(
    () => sumTransactionsByCategoryForMonth(reportFinance.transactions, year, monthIndex, people),
    [reportFinance.transactions, year, monthIndex, people],
  )

  const budgetVsRows = useMemo(
    () => buildBudgetVsActual(reportFinance.budgetCategories, monthTotals, monthIndex),
    [reportFinance.budgetCategories, monthTotals, monthIndex],
  )

  const budgetVsByParent = useMemo(() => groupBudgetVsActualByParent(budgetVsRows), [budgetVsRows])

  const kpis = useMemo(
    () =>
      buildBankReportKpis(
        reportFinance.debts,
        reportFinance.investments,
        reportFinance.savingsGoals,
        monthTotals,
      ),
    [reportFinance.debts, reportFinance.investments, reportFinance.savingsGoals, monthTotals],
  )

  const rolling3m = useMemo(
    () => sumIncomeExpenseNetThreeMonthWindow(reportFinance.transactions, year, monthIndex, people),
    [reportFinance.transactions, year, monthIndex, people],
  )

  const incomeDetail = useMemo(
    () =>
      buildBankReportIncomeDetail(
        reportFinance.transactions,
        reportFinance.budgetCategories,
        year,
        monthIndex,
        people,
      ),
    [reportFinance.transactions, reportFinance.budgetCategories, year, monthIndex, people],
  )

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    const base = Array.from({ length: 11 }, (_, i) => y - 5 + i)
    const set = new Set([...base, budgetYear])
    return [...set].sort((a, b) => a - b)
  }, [budgetYear])

  const toggleSection = (key: BankReportSectionKey) => {
    setSections((s) => ({ ...s, [key]: !s[key] }))
  }

  const handlePrint = () => {
    setGeneratedAt(new Date())
    requestAnimationFrame(() => {
      window.print()
    })
  }

  const handlePdf = useCallback(async () => {
    const el = reportRef.current
    if (!el) return
    setPdfLoading(true)
    setGeneratedAt(new Date())
    try {
      await new Promise((r) => requestAnimationFrame(r))
      const key = getMonthKey(year, monthIndex)
      await exportBankReportPdf(el, `rapport-til-bank-${key}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }, [year, monthIndex])

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <div className="print-hidden">
        <Header title="Rapport til bank" subtitle="Dokument for bank og egen oversikt" />
        <div
          className="px-4 sm:px-8 py-4 border-b min-w-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col gap-4 min-w-0">
            <Link
              href="/rapporter"
              className="inline-flex items-center gap-1 text-sm font-medium min-h-[44px] w-fit touch-manipulation py-1"
              style={{ color: 'var(--primary)' }}
            >
              <ChevronLeft size={16} />
              Rapporter
            </Link>
            <div className="flex flex-col gap-3 w-full min-w-0 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 w-full min-w-0 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex flex-col gap-1 text-sm min-w-0 flex-1 sm:flex-initial sm:min-w-[7.5rem]" style={{ color: 'var(--text-muted)' }}>
                  <span>År</span>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl text-sm touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm min-w-0 flex-1 sm:flex-initial sm:min-w-[9rem]" style={{ color: 'var(--text-muted)' }}>
                  <span>Måned</span>
                  <select
                    value={monthIndex}
                    onChange={(e) => setMonthIndex(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl text-sm touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    {MONTH_OPTIONS.map((label, i) => (
                      <option key={label} value={i}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {isHouseholdAggregate ? (
                  <label className="flex flex-col gap-1 text-sm min-w-0 w-full sm:flex-1 sm:min-w-[12rem]" style={{ color: 'var(--text-muted)' }}>
                    <span>Rapport gjelder</span>
                    <select
                      value={reportSubject}
                      onChange={(e) =>
                        setReportSubject(
                          e.target.value === 'household' ? 'household' : e.target.value,
                        )
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl text-sm min-w-0 touch-manipulation"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                      title="Velg om tallene skal være for hele husholdningen eller én person"
                    >
                      <option value="household">Husholdning (samlet)</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 w-full min-w-0 sm:flex-row sm:w-auto sm:justify-end">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium touch-manipulation w-full sm:w-auto"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <Printer size={16} />
                  Skriv ut
                </button>
                <button
                  type="button"
                  onClick={handlePdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium text-white disabled:opacity-60 touch-manipulation w-full sm:w-auto"
                  style={{ background: 'var(--primary)' }}
                >
                  <FileDown size={16} />
                  {pdfLoading ? 'Genererer PDF…' : 'Eksporter til PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mx-auto max-w-4xl px-4 py-4 sm:px-8"
          style={{ background: 'var(--bg)' }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            Inkluder i rapporten
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(Object.keys(SECTION_LABELS) as BankReportSectionKey[]).map((key) => (
              <label
                key={key}
                className="inline-flex items-center gap-2 text-sm cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <input
                  type="checkbox"
                  checked={sections[key]}
                  onChange={() => toggleSection(key)}
                />
                {SECTION_LABELS[key]}
              </label>
            ))}
          </div>
          {sections.freeText ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Kort om situasjonen (valgfritt)</span>
                <textarea
                  value={freeTextSituation}
                  onChange={(e) => setFreeTextSituation(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
              </label>
              <label className="block text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Formål med henvendelsen (valgfritt)</span>
                <textarea
                  value={freeTextPurpose}
                  onChange={(e) => setFreeTextPurpose(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-8">
        <BankReportDocument
          ref={reportRef}
          generatedAt={generatedAt}
          year={year}
          monthIndex={monthIndex}
          scopeLabel={scopeLabel}
          kpis={kpis}
          debts={reportFinance.debts}
          savingsGoals={reportFinance.savingsGoals}
          investments={reportFinance.investments}
          budgetVsByParent={budgetVsByParent}
          sections={sections}
          freeTextSituation={freeTextSituation}
          freeTextPurpose={freeTextPurpose}
          rolling3m={sections.rolling3m ? rolling3m : null}
          incomeDetail={incomeDetail}
        />
      </div>
    </div>
  )
}
