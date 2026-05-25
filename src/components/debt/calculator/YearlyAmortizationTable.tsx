'use client'

import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { YearlyAmortizationRow } from '@/lib/studentLoanCalculator'

const YEARLY_GRID =
  'grid gap-0 items-center min-w-[28rem] grid-cols-[2.5rem_1fr_1fr_1fr_1fr] sm:min-w-[36rem]'

export default function YearlyAmortizationTable({ rows }: { rows: YearlyAmortizationRow[] }) {
  const { formatNOK } = useNokDisplayFormatters()
  if (rows.length === 0) return null

  return (
    <div
      className="overflow-x-auto overscroll-x-contain rounded-xl border touch-manipulation"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className={`${YEARLY_GRID} px-2 py-2 text-xs font-semibold border-b`}
        style={{ background: 'var(--surface)', color: 'var(--text)' }}
      >
        <span>År</span>
        <span className="text-right">Snitt pr. md.</span>
        <span className="text-right">Renter</span>
        <span className="text-right">Avdrag</span>
        <span className="text-right">Restgjeld</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.yearIndex}
          className={`${YEARLY_GRID} px-2 py-2 text-sm border-b`}
          style={{ borderColor: 'var(--border)' }}
        >
          <span style={{ color: 'var(--text)' }}>{row.yearIndex}</span>
          <span className="text-right tabular-nums" style={{ color: 'var(--text)' }}>
            {formatNOK(row.avgMonthlyPayment)}
          </span>
          <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {formatNOK(row.interestPaid)}
          </span>
          <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {formatNOK(row.principalPaid)}
          </span>
          <span className="text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {formatNOK(row.balanceAfter)}
          </span>
        </div>
      ))}
    </div>
  )
}
