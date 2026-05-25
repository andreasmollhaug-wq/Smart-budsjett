'use client'

import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { TermComparisonRow } from '@/lib/studentLoanCalculator'

export default function TermComparisonTable({
  rows,
  selectedYears,
}: {
  rows: TermComparisonRow[]
  selectedYears: number
}) {
  const { formatNOK } = useNokDisplayFormatters()
  if (rows.length === 0) return null

  return (
    <div className="space-y-2 min-w-0">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        Hva sparer du ved å betale raskere?
      </p>
      <div
        className="overflow-x-auto overscroll-x-contain rounded-xl border touch-manipulation"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="grid gap-0 items-center min-w-[28rem] grid-cols-[3rem_1fr_1fr_1fr] sm:min-w-[36rem] px-2 py-2 text-xs font-semibold border-b"
          style={{ background: 'var(--surface)', color: 'var(--text)' }}
        >
          <span>År</span>
          <span className="text-right">Månedlig</span>
          <span className="text-right">Renter totalt</span>
          <span className="text-right">Besparelse</span>
        </div>
        {rows.map((row) => {
          const isSelected = row.years === selectedYears
          return (
            <div
              key={row.years}
              className="grid gap-0 items-center min-w-[28rem] grid-cols-[3rem_1fr_1fr_1fr] sm:min-w-[36rem] px-2 py-2.5 text-sm border-b"
              style={{
                borderColor: 'var(--border)',
                background: isSelected ? 'var(--primary-pale)' : undefined,
              }}
            >
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {row.years}
                {isSelected ? ' *' : ''}
              </span>
              <span className="text-right tabular-nums" style={{ color: 'var(--text)' }}>
                {formatNOK(row.monthlyPayment)}
              </span>
              <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {formatNOK(row.totalInterest)}
              </span>
              <span
                className="text-right tabular-nums"
                style={{
                  color:
                    row.interestSavedVsSelected > 0
                      ? 'var(--success)'
                      : row.interestSavedVsSelected < 0
                        ? 'var(--danger)'
                        : 'var(--text-muted)',
                }}
              >
                {row.interestSavedVsSelected === 0
                  ? '—'
                  : row.interestSavedVsSelected > 0
                    ? `− ${formatNOK(row.interestSavedVsSelected)}`
                    : `+ ${formatNOK(Math.abs(row.interestSavedVsSelected))}`}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        * Valgt nedbetalingstid. Besparelse er renter spart sammenlignet med valgt løpetid.
      </p>
    </div>
  )
}
