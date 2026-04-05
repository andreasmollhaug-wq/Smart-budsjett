'use client'

import { useEffect, useMemo } from 'react'
import type { BudgetCategory, Transaction } from '@/lib/store'
import {
  MONTH_LABELS_SHORT_NB,
  sumActualsByMonthForType,
  sumBudgetedByMonthForType,
} from '@/lib/bankReportData'
import { formatNOK } from '@/lib/utils'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  mode: 'income' | 'expense'
  budgetYear: number
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
}

function signedNOK(n: number): string {
  const abs = formatNOK(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

export default function DashboardIncomeExpenseMonthlyModal({
  open,
  onClose,
  mode,
  budgetYear,
  transactions,
  budgetCategories,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const actuals = useMemo(
    () => sumActualsByMonthForType(transactions ?? [], budgetYear, mode),
    [transactions, budgetYear, mode],
  )

  const budgeted = useMemo(
    () => sumBudgetedByMonthForType(budgetCategories, mode),
    [budgetCategories, mode],
  )

  if (!open) return null

  const title = mode === 'income' ? 'Inntekt per måned' : 'Utgifter per måned'
  const titleId = 'dashboard-kpi-monthly-modal-title'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(88vh,720px)] w-full max-w-md flex-col rounded-2xl shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
          <div>
            <h2 id={titleId} className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {title}
            </h2>
            <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
              Budsjettår {budgetYear}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div
              className="grid grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-3 sm:gap-x-4 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.05em]"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
            >
              <span>Måned</span>
              <span className="text-right tabular-nums">Budsjett</span>
              <span className="text-right tabular-nums">Faktisk</span>
              <span className="text-right tabular-nums">Avvik</span>
            </div>
            <div>
              {MONTH_LABELS_SHORT_NB.map((label, m) => {
                const b = budgeted[m] ?? 0
                const a = actuals[m] ?? 0
                const variance = a - b
                const avvikColor =
                  mode === 'income'
                    ? variance >= 0
                      ? 'var(--success)'
                      : 'var(--danger)'
                    : variance <= 0
                      ? 'var(--success)'
                      : 'var(--danger)'

                return (
                  <div
                    key={label}
                    className="grid grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-3 sm:gap-x-4 px-4 py-2.5 text-[14px] leading-tight items-baseline border-b border-[var(--border)] last:border-b-0"
                  >
                    <span style={{ color: 'var(--text)' }}>{label}</span>
                    <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                      {formatNOK(b)}
                    </span>
                    <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                      {formatNOK(a)}
                    </span>
                    <span className="text-right tabular-nums text-[13px]" style={{ color: avvikColor }}>
                      {signedNOK(variance)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-[12px] mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Faktisk er summerte transaksjoner. Avvik er faktisk minus budsjett.
          </p>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-[15px] font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
