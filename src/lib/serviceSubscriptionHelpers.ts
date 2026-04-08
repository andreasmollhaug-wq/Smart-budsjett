/** Månedlig kostnad i NOK (årlig pris fordeles likt på 12 måneder). */
export function monthlyEquivalentNok(sub: { amountNok: number; billing: 'monthly' | 'yearly' }): number {
  const a = sub.amountNok
  if (!Number.isFinite(a) || a < 0) return 0
  return sub.billing === 'yearly' ? a / 12 : a
}

export function yearlyEquivalentNok(sub: { amountNok: number; billing: 'monthly' | 'yearly' }): number {
  const a = sub.amountNok
  if (!Number.isFinite(a) || a < 0) return 0
  return sub.billing === 'yearly' ? a : a * 12
}

export function budgetedTwelveFromMonthly(monthly: number): number[] {
  const m = Number.isFinite(monthly) && monthly >= 0 ? monthly : 0
  return Array(12).fill(m)
}

/** Unikt kategorinavn (unngår kollisjon med eksisterende linjer). */
export function uniqueRegningerName(desired: string, categoryNames: string[]): string {
  const trimmed = desired.trim() || 'Tjeneste'
  const names = new Set(categoryNames)
  if (!names.has(trimmed)) return trimmed
  let i = 2
  while (names.has(`${trimmed} (${i})`)) i += 1
  return `${trimmed} (${i})`
}

export function buildBudgetCategoryForSubscription(
  categoryId: string,
  displayName: string,
  monthly: number,
): {
  id: string
  name: string
  budgeted: number[]
  spent: number
  type: 'expense'
  color: string
  parentCategory: 'regninger'
  frequency: 'monthly'
} {
  const budgeted = budgetedTwelveFromMonthly(monthly)
  return {
    id: categoryId,
    name: displayName,
    budgeted,
    spent: 0,
    type: 'expense',
    color: '#868E96',
    parentCategory: 'regninger',
    frequency: 'monthly',
  }
}
