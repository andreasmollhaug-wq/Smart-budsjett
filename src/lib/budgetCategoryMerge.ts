import type { BudgetCategory } from '@/lib/store'

function ensureTwelve(budgeted: number[]): number[] {
  const a = Array(12).fill(0)
  for (let i = 0; i < 12; i++) a[i] = budgeted[i] ?? 0
  return a
}

/**
 * Slår sammen innkommende månedsplan og spent inn i en eksisterende budsjettlinje
 * og normaliserer `frequency` / `onceMonthIndex` ut fra antall måneder med beløp > 0.
 */
export function mergeBudgetCategoryValues(
  existing: BudgetCategory,
  incomingBudgeted: number[],
  incomingSpent: number,
): Partial<BudgetCategory> {
  const eb = ensureTwelve(Array.isArray(existing.budgeted) ? existing.budgeted : [])
  const ib = ensureTwelve(incomingBudgeted)
  const budgeted = eb.map((v, i) => v + ib[i])
  const spent = existing.spent + incomingSpent

  const positiveMonthIndexes = budgeted
    .map((v, i) => (v > 0 ? i : -1))
    .filter((i): i is number => i >= 0)

  if (positiveMonthIndexes.length === 1) {
    return {
      budgeted,
      spent,
      frequency: 'once',
      onceMonthIndex: positiveMonthIndexes[0],
    }
  }

  return {
    budgeted,
    spent,
    frequency: 'monthly',
    onceMonthIndex: undefined,
  }
}
