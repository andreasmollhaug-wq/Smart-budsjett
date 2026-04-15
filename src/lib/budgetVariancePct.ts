/** Avvik i prosent mot budsjettert beløp (variance / budgeted * 100). */
export function variancePctVsBudget(budgeted: number, variance: number): string | null {
  if (!Number.isFinite(budgeted) || budgeted === 0) return null
  const pct = (variance / budgeted) * 100
  if (!Number.isFinite(pct)) return null
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)} %`
}

/** Nettolinje: avvik i prosent med budsjettert netto som nevner. */
export function netVariancePct(budgetNet: number, varianceNet: number): string | null {
  if (!Number.isFinite(budgetNet) || budgetNet === 0) return null
  const pct = (varianceNet / budgetNet) * 100
  if (!Number.isFinite(pct)) return null
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)} %`
}
