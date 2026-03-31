'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import BankReportDocument from '@/components/reports/BankReportDocument'
import {
  buildBankReportKpis,
  buildBudgetVsActual,
  getMonthKey,
  groupBudgetVsActualByParent,
  sumTransactionsByCategoryForMonth,
} from '@/lib/bankReportData'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import { useActivePersonFinance } from '@/lib/store'
import { ChevronLeft, FileDown, Printer } from 'lucide-react'

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

export default function RapportBankPage() {
  const {
    transactions,
    budgetCategories,
    debts,
    savingsGoals,
    investments,
    activeProfileId,
    profiles,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const [year, setYear] = useState(() => new Date().getFullYear())
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [pdfLoading, setPdfLoading] = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.dataset.printReport = 'true'
    return () => {
      delete document.body.dataset.printReport
    }
  }, [])

  const scopeLabel = useMemo(() => {
    if (isHouseholdAggregate) return 'Husholdning (alle profiler)'
    const name = profiles.find((p) => p.id === activeProfileId)?.name
    return name ?? 'Profil'
  }, [isHouseholdAggregate, profiles, activeProfileId])

  const monthTotals = useMemo(
    () => sumTransactionsByCategoryForMonth(transactions, year, monthIndex),
    [transactions, year, monthIndex],
  )

  const budgetVsRows = useMemo(
    () => buildBudgetVsActual(budgetCategories, monthTotals, monthIndex),
    [budgetCategories, monthTotals, monthIndex],
  )

  const budgetVsByParent = useMemo(() => groupBudgetVsActualByParent(budgetVsRows), [budgetVsRows])

  const kpis = useMemo(
    () => buildBankReportKpis(debts, investments, savingsGoals, monthTotals),
    [debts, investments, savingsGoals, monthTotals],
  )

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => y - 5 + i)
  }, [])

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
          className="px-8 py-4 flex flex-wrap items-center gap-3 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Link
            href="/rapporter"
            className="inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <ChevronLeft size={16} />
            Rapporter
          </Link>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <label className="text-sm" style={{ color: 'var(--text-muted)' }}>
              År
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="ml-2 px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Måned
              <select
                value={monthIndex}
                onChange={(e) => setMonthIndex(Number(e.target.value))}
                className="ml-2 px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {MONTH_OPTIONS.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Printer size={16} />
              Skriv ut
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={pdfLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              <FileDown size={16} />
              {pdfLoading ? 'Genererer PDF…' : 'Eksporter til PDF'}
            </button>
          </div>
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
          debts={debts}
          savingsGoals={savingsGoals}
          investments={investments}
          budgetVsByParent={budgetVsByParent}
        />
      </div>
    </div>
  )
}
