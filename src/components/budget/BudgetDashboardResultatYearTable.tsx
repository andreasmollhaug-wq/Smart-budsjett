'use client'

import type { MonthlyBudgetActualPoint } from '@/lib/bankReportData'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

function netBudgeted(p: MonthlyBudgetActualPoint): number {
  return p.budgetedIncome - p.budgetedExpense
}

function netActual(p: MonthlyBudgetActualPoint): number {
  return p.actualIncome - p.actualExpense
}

function varianceNet(p: MonthlyBudgetActualPoint): number {
  return netActual(p) - netBudgeted(p)
}

function cellColor(value: number): string {
  if (value === 0) return 'var(--text)'
  return value >= 0 ? '#0CA678' : '#E03131'
}

/** Avvik som andel av budsjettert netto; null når budsjett netto er 0. */
function formatVariancePct(variance: number, budgetNet: number): string | null {
  if (budgetNet === 0) return null
  const pct = (variance / budgetNet) * 100
  return `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(pct)} %`
}

export default function BudgetDashboardResultatYearTable({
  series,
  year,
}: {
  series: MonthlyBudgetActualPoint[]
  year: number
}) {
  const { formatNOK } = useNokDisplayFormatters()
  const sumB = series.reduce((s, p) => s + netBudgeted(p), 0)
  const sumA = series.reduce((s, p) => s + netActual(p), 0)
  const sumV = sumA - sumB
  const yearVariancePct = formatVariancePct(sumV, sumB)

  return (
    <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 touch-pan-x">
      <table className="w-full min-w-[640px] text-sm border-collapse">
        <caption className="caption-top text-left font-semibold text-base pb-3 px-0 sr-only">
          Resultat per måned {year}
        </caption>
        <thead>
          <tr style={{ color: 'var(--text-muted)' }}>
            <th
              scope="col"
              className="text-left py-2 pr-3 pl-0 sticky left-0 z-[1] align-bottom min-w-[7.5rem]"
              style={{
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
              }}
            >
              Post
            </th>
            {series.map((p) => (
              <th
                key={p.monthIndex}
                scope="col"
                className="text-right py-2 px-1 font-medium whitespace-nowrap align-bottom tabular-nums"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {p.label}
              </th>
            ))}
            <th
              scope="col"
              className="text-right py-2 pl-2 pr-0 font-semibold whitespace-nowrap align-bottom tabular-nums"
              style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
            >
              År
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              scope="row"
              className="text-left py-2 pr-3 pl-0 sticky left-0 z-[1] align-middle font-medium"
              style={{
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                color: 'var(--text)',
              }}
            >
              Budsjett netto
            </th>
            {series.map((p) => (
              <td
                key={p.monthIndex}
                className="text-right py-2 px-1 tabular-nums align-middle"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {formatNOK(netBudgeted(p))}
              </td>
            ))}
            <td
              className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {formatNOK(sumB)}
            </td>
          </tr>
          <tr>
            <th
              scope="row"
              className="text-left py-2 pr-3 pl-0 sticky left-0 z-[1] align-middle font-medium"
              style={{
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                color: 'var(--text)',
              }}
            >
              Faktisk netto
            </th>
            {series.map((p) => (
              <td
                key={p.monthIndex}
                className="text-right py-2 px-1 tabular-nums align-middle"
                style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {formatNOK(netActual(p))}
              </td>
            ))}
            <td
              className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {formatNOK(sumA)}
            </td>
          </tr>
          <tr>
            <th
              scope="row"
              className="text-left py-2.5 pr-3 pl-0 sticky left-0 z-[1] align-top"
              style={{
                background: 'var(--primary-pale)',
                borderTop: '2px solid var(--accent)',
                boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                color: 'var(--primary)',
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Avvik (NOK)</span>
                <span className="text-xs font-normal leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Avvik %
                </span>
              </div>
            </th>
            {series.map((p) => {
              const v = varianceNet(p)
              const b = netBudgeted(p)
              const pct = formatVariancePct(v, b)
              return (
                <td
                  key={p.monthIndex}
                  className="text-right py-2.5 px-1 align-top"
                  style={{
                    borderTop: '2px solid var(--accent)',
                    background: 'var(--primary-pale)',
                  }}
                >
                  <div className="inline-flex flex-col items-end gap-0.5 tabular-nums">
                    <span className="font-semibold" style={{ color: cellColor(v) }}>
                      {formatNOK(v)}
                    </span>
                    {pct ? (
                      <span className="text-xs font-normal leading-tight" style={{ color: 'var(--text-muted)' }}>
                        {pct}
                      </span>
                    ) : null}
                  </div>
                </td>
              )
            })}
            <td
              className="text-right py-2.5 pl-2 pr-0 align-top"
              style={{
                borderTop: '2px solid var(--accent)',
                background: 'var(--primary-pale)',
              }}
            >
              <div className="inline-flex flex-col items-end gap-0.5 tabular-nums">
                <span className="font-semibold" style={{ color: cellColor(sumV) }}>
                  {formatNOK(sumV)}
                </span>
                {yearVariancePct ? (
                  <span className="text-xs font-normal leading-tight" style={{ color: 'var(--text-muted)' }}>
                    {yearVariancePct}
                  </span>
                ) : null}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
