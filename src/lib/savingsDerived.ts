import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'

export type GoalActivityRow =
  | { kind: 'transaction'; tx: Transaction }
  | { kind: 'deposit'; id: string; date: string; amount: number; note?: string }

export function resolveGoalProfileId(goal: SavingsGoal, fallbackProfileId: string): string {
  return goal.sourceProfileId ?? fallbackProfileId
}

export function getLinkedCategoryName(
  goal: SavingsGoal,
  budgetCategories: BudgetCategory[],
): string | undefined {
  if (!goal.linkedBudgetCategoryId) return undefined
  return budgetCategories.find((c) => c.id === goal.linkedBudgetCategoryId)?.name
}

export function sumSavingsTransactionsForCategory(
  transactions: Transaction[],
  categoryName: string,
  profileId: string,
): number {
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.category === categoryName &&
        (t.profileId ?? profileId) === profileId,
    )
    .reduce((s, t) => s + t.amount, 0)
}

export function getEffectiveCurrentAmount(
  goal: SavingsGoal,
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): number {
  if (!goal.linkedBudgetCategoryId) {
    return goal.currentAmount
  }
  const cat = budgetCategories.find((c) => c.id === goal.linkedBudgetCategoryId)
  if (!cat) return goal.currentAmount
  const pid = resolveGoalProfileId(goal, fallbackProfileId)
  const baseline = goal.baselineAmount ?? 0
  return baseline + sumSavingsTransactionsForCategory(transactions, cat.name, pid)
}

export function getTotalEffectiveSaved(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): number {
  return goals.reduce(
    (sum, g) => sum + getEffectiveCurrentAmount(g, transactions, budgetCategories, fallbackProfileId),
    0,
  )
}

/** Andel av total sparing (alle mål) som dette målet utgjør — 0–100. */
export function getPortfolioSharePercent(
  goal: SavingsGoal,
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): number {
  const total = getTotalEffectiveSaved(goals, transactions, budgetCategories, fallbackProfileId)
  if (total <= 0) return 0
  const cur = getEffectiveCurrentAmount(goal, transactions, budgetCategories, fallbackProfileId)
  return Math.min(100, (cur / total) * 100)
}

export function getGoalActivityRows(
  goal: SavingsGoal,
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): GoalActivityRow[] {
  if (goal.linkedBudgetCategoryId) {
    const cat = budgetCategories.find((c) => c.id === goal.linkedBudgetCategoryId)
    if (!cat) return []
    const pid = resolveGoalProfileId(goal, fallbackProfileId)
    const txs = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        t.category === cat.name &&
        (t.profileId ?? fallbackProfileId) === pid,
    )
    const sorted = [...txs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    return sorted.map((tx) => ({ kind: 'transaction' as const, tx }))
  }
  const deps = goal.deposits ?? []
  const sorted = [...deps].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  return sorted.map((d) => ({
    kind: 'deposit' as const,
    id: d.id,
    date: d.date,
    amount: d.amount,
    note: d.note,
  }))
}
