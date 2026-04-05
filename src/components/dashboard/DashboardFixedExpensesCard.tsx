'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import type { BudgetCategory } from '@/lib/store'
import {
  MONTH_LABELS_SHORT_NB,
  referenceMonthIndexForBudgetYear,
  sumBudgetedFixedMonthlyExpensesForMonth,
  sumBudgetedIncomeForMonth,
} from '@/lib/bankReportData'
import { formatNOK } from '@/lib/utils'
import { Info, Receipt } from 'lucide-react'

type Props = {
  budgetYear: number
  budgetCategories: BudgetCategory[]
}

export default function DashboardFixedExpensesCard({ budgetYear, budgetCategories }: Props) {
  const [infoOpen, setInfoOpen] = useState(false)
  const infoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const close = (e: MouseEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [infoOpen])

  const refMonth = useMemo(() => referenceMonthIndexForBudgetYear(budgetYear), [budgetYear])

  const { fixedSum, pct } = useMemo(() => {
    const fixed = sumBudgetedFixedMonthlyExpensesForMonth(budgetCategories, refMonth)
    const inc = sumBudgetedIncomeForMonth(budgetCategories, refMonth)
    const p = inc > 0 ? (fixed / inc) * 100 : null
    return { fixedSum: fixed, pct: p }
  }, [budgetCategories, refMonth])

  const monthLabel = MONTH_LABELS_SHORT_NB[refMonth] ?? ''

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1 min-w-0 flex-1">
          <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
            Faste utgifter
          </span>
          <div className="relative shrink-0 pt-0.5" ref={infoWrapRef}>
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              aria-expanded={infoOpen}
              aria-label="Mer om faste utgifter"
              className="p-0.5 rounded-md -m-0.5 transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              <Info size={15} strokeWidth={2} aria-hidden />
            </button>
            {infoOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1.5 w-[min(calc(100vw-2rem),18rem)] rounded-xl p-3 text-left shadow-lg"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                role="region"
              >
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Summerer budsjettert beløp for utgiftskategorier med månedlig frekvens. Andelen er faste utgifter
                  dividert med budsjettert månedlig inntekt for {monthLabel} i {budgetYear}. Bruker plan tall, ikke
                  faktiske transaksjoner.
                </p>
              </div>
            )}
          </div>
        </div>
        <div
          className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
          style={{ background: '#F08C0020' }}
        >
          <Receipt size={18} style={{ color: '#F08C00' }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {formatNOK(fixedSum)}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Budsjett for {monthLabel} · månedlige utgifter
        </p>
        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text)' }}>
          {pct != null && Number.isFinite(pct) ? (
            <>Ca. {pct.toFixed(0)} % av budsjettert månedlig inntekt</>
          ) : (
            <>— (ingen budsjettert inntekt for {monthLabel})</>
          )}
        </p>
      </div>
    </div>
  )
}
