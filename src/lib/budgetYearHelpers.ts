import type { BudgetCategory, Transaction } from '@/lib/store'

/** Dyp kopi av budsjettkategorier (inkl. budgeted-array). */
export function cloneBudgetCategories(cats: BudgetCategory[]): BudgetCategory[] {
  return cats.map((c) => ({
    ...c,
    budgeted: Array.from({ length: 12 }, (_, i) => c.budgeted[i] ?? 0),
  }))
}

export function sumTxForCategoryInYear(
  transactions: Transaction[],
  categoryName: string,
  type: 'income' | 'expense',
  year: number,
  profileId: string,
): number {
  const prefix = `${year}-`
  return transactions
    .filter(
      (t) =>
        t.category === categoryName &&
        t.type === type &&
        t.date.startsWith(prefix) &&
        (t.profileId ?? profileId) === profileId,
    )
    .reduce((s, t) => s + t.amount, 0)
}

export function sumTxForCategoryInYearAllProfiles(
  transactions: Transaction[],
  categoryName: string,
  type: 'income' | 'expense',
  year: number,
): number {
  const prefix = `${year}-`
  return transactions
    .filter(
      (t) => t.category === categoryName && t.type === type && t.date.startsWith(prefix),
    )
    .reduce((s, t) => s + t.amount, 0)
}
