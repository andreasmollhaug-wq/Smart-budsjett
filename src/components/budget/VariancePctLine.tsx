import { formatPercent, variancePercentOfBudget } from '@/lib/utils'

/** Diskret avvik i prosent av budsjett (under hovedbeløpet). */
export default function VariancePctLine({ variance, budgeted }: { variance: number; budgeted: number }) {
  const pct = variancePercentOfBudget(variance, budgeted)
  if (pct === null) {
    return (
      <span className="text-[11px] sm:text-xs leading-tight tabular-nums" style={{ color: 'var(--text-muted)' }}>
        –
      </span>
    )
  }
  return (
    <span className="text-[11px] sm:text-xs leading-tight tabular-nums" style={{ color: 'var(--text-muted)' }}>
      {pct > 0 ? '+' : ''}
      {formatPercent(pct)}
    </span>
  )
}
