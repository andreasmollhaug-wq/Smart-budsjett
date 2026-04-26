'use client'

import { useMemo } from 'react'
import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { REPORT_GROUP_LABELS, REPORT_GROUP_ORDER, sumBudgetVsActualByParent } from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetVsSummary } from '@/lib/dashboardOverviewHelpers'
import { formatNokCurrencyDisplay } from '@/lib/money/nokDisplayFormat'
import { useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

type Props = {
  periodLabel: string
  budgetVsRows: BudgetVsActualRow[]
  summary: BudgetVsSummary
}

function groupRowVisual(
  parent: ParentCategory,
  budgeted: number,
  actual: number,
): { displayPct: number; fill: string } {
  if (budgeted <= 0) {
    return { displayPct: 0, fill: 'var(--text-muted)' }
  }
  const rawPct = (actual / budgeted) * 100
  const displayPct = Math.min(100, Math.max(0, Math.round(rawPct)))
  const isIncome = parent === 'inntekter'
  const isOverExpense = !isIncome && actual > budgeted
  const fill = isOverExpense
    ? 'var(--danger)'
    : parent === 'sparing'
      ? 'var(--primary)'
      : 'var(--success)'
  return { displayPct, fill }
}

function rightCaptionIncome(budgeted: number, actual: number): { amount: string; sub: string; color: string } {
  const show = useStore.getState().showAmountDecimals
  const fmt = (n: number) => formatNokCurrencyDisplay(n, show)
  if (budgeted <= 0) {
    return { amount: '–', sub: 'Ingen plan', color: 'var(--text-muted)' }
  }
  if (actual < budgeted) {
    return {
      amount: fmt(budgeted - actual),
      sub: 'gjenstående',
      color: 'var(--success)',
    }
  }
  if (actual > budgeted) {
    return {
      amount: fmt(actual - budgeted),
      sub: 'over plan',
      color: 'var(--success)',
    }
  }
  return { amount: fmt(0), sub: 'gjenstående', color: 'var(--text-muted)' }
}

function rightCaptionExpense(budgeted: number, actual: number): { amount: string; sub: string; color: string } {
  const show = useStore.getState().showAmountDecimals
  const fmt = (n: number) => formatNokCurrencyDisplay(n, show)
  if (budgeted <= 0) {
    return { amount: '–', sub: 'Ingen plan', color: 'var(--text-muted)' }
  }
  if (actual <= budgeted) {
    return {
      amount: fmt(budgeted - actual),
      sub: 'gjenstående',
      color: 'var(--success)',
    }
  }
  return {
    amount: fmt(actual - budgeted),
    sub: 'over budsjett',
    color: 'var(--danger)',
  }
}

export default function DashboardParentBudgetProgressCard({ periodLabel, budgetVsRows, summary }: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const byParent = useMemo(() => sumBudgetVsActualByParent(budgetVsRows), [budgetVsRows])

  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Oppsummering per hovedgruppe
      </h2>
      <p className="mb-4 text-xs leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
        Faktisk mot budsjett · {periodLabel}
      </p>

      <div className="space-y-5">
        {REPORT_GROUP_ORDER.map((key) => {
          const { budgeted, actual } = byParent[key]
          const { displayPct, fill } = groupRowVisual(key, budgeted, actual)
          const isIncome = key === 'inntekter'
          const right = isIncome
            ? rightCaptionIncome(budgeted, actual)
            : rightCaptionExpense(budgeted, actual)

          return (
            <div key={key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {REPORT_GROUP_LABELS[key]}
                </p>
                <p className="text-sm tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {formatNOK(budgeted)} budsjett
                </p>
              </div>
              <div
                className="mt-2 h-2.5 rounded-full overflow-hidden min-w-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={budgeted > 0 ? displayPct : 0}
                aria-label={`${REPORT_GROUP_LABELS[key]}: ${displayPct} prosent av budsjett brukt i perioden`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: budgeted > 0 ? `${displayPct}%` : 0, background: fill }}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3 min-w-0 text-sm">
                <p className="min-w-0">
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatNOK(actual)}
                  </span>
                  <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                    faktisk
                  </span>
                </p>
                <p className="shrink-0 text-right min-w-0">
                  {right.amount !== '–' ? (
                    <>
                      <span className="font-semibold tabular-nums" style={{ color: right.color }}>
                        {right.amount}
                      </span>
                      <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {right.sub}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {right.sub}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="mt-6 pt-4 border-t min-w-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Netto (faktisk)
        </p>
        <p
          className="text-xl font-bold tabular-nums mt-0.5"
          style={{ color: summary.actualNet >= 0 ? 'var(--success)' : 'var(--danger)' }}
        >
          {formatNOK(summary.actualNet)}
        </p>
        <p className="text-xs leading-snug break-words tabular-nums mt-1" style={{ color: 'var(--text-muted)' }}>
          Plan: {formatNOK(summary.budgetNet)} · Avvik {formatNOK(summary.varianceNet)}
        </p>
      </div>
    </div>
  )
}
