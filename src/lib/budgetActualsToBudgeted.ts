import type { Transaction } from '@/lib/store'

/**
 * Faktiske beløp per måned (0–11) for én kategori i et kalenderår.
 */
export function actualsPerMonthForCategory(
  transactions: Transaction[],
  profileId: string,
  year: number,
  categoryName: string,
  type: 'income' | 'expense',
): number[] {
  return Array.from({ length: 12 }, (_, m) => {
    const prefix = `${year}-${String(m + 1).padStart(2, '0')}`
    return transactions
      .filter(
        (t) =>
          t.category === categoryName &&
          t.type === type &&
          t.date.startsWith(prefix) &&
          (t.profileId ?? profileId) === profileId,
      )
      .reduce((s, t) => s + t.amount, 0)
  })
}

export type BudgetYearCopySource = 'budget' | 'actual' | 'zero'
