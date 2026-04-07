'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { BudgetCategory } from '@/lib/store'
import {
  MONTH_LABELS_SHORT_NB,
  listBudgetedFixedMonthlyExpensesForMonth,
  referenceMonthIndexForBudgetYear,
  sumBudgetedFixedMonthlyExpensesForMonth,
  sumBudgetedIncomeForMonth,
} from '@/lib/bankReportData'
import { formatNOK } from '@/lib/utils'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  budgetYear: number
  budgetCategories: BudgetCategory[]
}

export default function DashboardFixedExpensesModal({ open, onClose, budgetYear, budgetCategories }: Props) {
  const refMonth = useMemo(() => referenceMonthIndexForBudgetYear(budgetYear), [budgetYear])
  const monthLabel = MONTH_LABELS_SHORT_NB[refMonth] ?? ''

  const { rows, total, pct } = useMemo(() => {
    const list = listBudgetedFixedMonthlyExpensesForMonth(budgetCategories, refMonth)
    const t = sumBudgetedFixedMonthlyExpensesForMonth(budgetCategories, refMonth)
    const inc = sumBudgetedIncomeForMonth(budgetCategories, refMonth)
    const p = inc > 0 ? (t / inc) * 100 : null
    return { rows: list, total: t, pct: p }
  }, [budgetCategories, refMonth])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-fixed-exp-modal-title"
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 id="dashboard-fixed-exp-modal-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Faste utgifter
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Budsjett for {monthLabel} {budgetYear} · månedlige utgiftslinjer
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Lukk"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-2">
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Summerer budsjettert beløp for utgiftskategorier med månedlig frekvens. Andelen er faste utgifter dividert med
            budsjettert månedlig inntekt for {monthLabel}. Bruker plan tall, ikke faktiske transaksjoner.
          </p>

          {rows.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen månedlige utgiftslinjer med budsjett for denne måneden.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <span className="min-w-0 flex-1 font-medium truncate" style={{ color: 'var(--text)' }}>
                    {row.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatNOK(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-5 py-4 space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Sum</span>
            <span className="font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(total)}
            </span>
          </div>
          {pct != null && Number.isFinite(pct) ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ca. {pct.toFixed(0)} % av budsjettert månedlig inntekt
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ingen budsjettert inntekt for {monthLabel} — andel kan ikke angis.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t p-5" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Lukk
          </button>
          <Link
            href="/budsjett"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Gå til budsjett
          </Link>
        </div>
      </div>
    </div>
  )
}
