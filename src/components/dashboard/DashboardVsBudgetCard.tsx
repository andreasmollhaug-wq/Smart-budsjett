'use client'

import Link from 'next/link'
import type { PeriodMode } from '@/lib/budgetPeriod'
import type { BudgetVsSummary } from '@/lib/dashboardOverviewHelpers'
import { transactionsHrefForCategory } from '@/lib/budgetDashboardLinks'
import { formatNOK } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

type Props = {
  periodLabel: string
  filterYear: number
  periodMode: PeriodMode
  monthIndex: number
  summary: BudgetVsSummary
  coverage: { withTx: number; total: number }
}

export default function DashboardVsBudgetCard({
  periodLabel,
  filterYear,
  periodMode,
  monthIndex,
  summary,
  coverage,
}: Props) {
  const lowCoverage =
    coverage.total > 0 && (coverage.withTx / coverage.total < 0.5 || coverage.total - coverage.withTx >= 2)

  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Mot budsjett
      </h2>
      <p className="mb-4 text-xs leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
        Plan vs. faktisk · {periodLabel}
      </p>

      {coverage.total > 0 && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Transaksjoner registrert i {coverage.withTx} av {coverage.total}{' '}
          {coverage.total === 1 ? 'måned' : 'måneder'} i perioden.
        </p>
      )}

      {lowCoverage && (
        <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Avvik mot budsjett kan påvirkes av måneder uten innlegging.{' '}
          <Link href="/transaksjoner" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--primary)' }}>
            Transaksjoner
          </Link>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Inntekt
            </p>
            <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(summary.actualIncome)} <span className="text-sm font-normal opacity-80">faktisk</span>
            </p>
            <p className="text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {formatNOK(summary.budgetedIncome)} budsjettert
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Utgifter
            </p>
            <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(summary.actualExpense)} <span className="text-sm font-normal opacity-80">faktisk</span>
            </p>
            <p className="text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {formatNOK(summary.budgetedExpense)} budsjettert
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Netto (faktisk)
            </p>
            <p
              className="text-xl font-bold tabular-nums"
              style={{ color: summary.actualNet >= 0 ? 'var(--success)' : 'var(--danger)' }}
            >
              {formatNOK(summary.actualNet)}
            </p>
            <p className="text-xs leading-snug break-words tabular-nums" style={{ color: 'var(--text-muted)' }}>
              Plan: {formatNOK(summary.budgetNet)} · Avvik {formatNOK(summary.varianceNet)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Mest over budsjett (utgift)
          </p>
          {summary.worstExpenseOvers.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen utgiftskategorier over budsjett i perioden.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.worstExpenseOvers.map((row) => (
                <li key={row.name}>
                  <Link
                    href={transactionsHrefForCategory(periodMode, filterYear, monthIndex, row.name)}
                    className="flex min-h-[44px] touch-manipulation items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    style={{ background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <span className="truncate font-medium">{row.name}</span>
                    <span className="shrink-0 tabular-nums" style={{ color: 'var(--danger)' }}>
                      +{formatNOK(row.variance)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link
        href="/budsjett/dashboard"
        className="mt-6 inline-flex min-h-[44px] touch-manipulation items-center gap-1 rounded-lg py-2 text-sm font-medium outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        style={{ color: 'var(--primary)' }}
      >
        Full oversikt i budsjett dashboard
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}
