import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { calcProgress } from '@/lib/utils'

export type GoalActivityRow =
  | { kind: 'transaction'; tx: Transaction }
  | { kind: 'deposit'; id: string; date: string; amount: number; note?: string }

export function resolveGoalProfileId(goal: SavingsGoal, fallbackProfileId: string): string {
  return goal.sourceProfileId ?? fallbackProfileId
}

/** Profil og faktisk mål-id i persistert data (aggregerte mål har `hh-{profileId}-{id}`). */
export function resolveSavingsGoalStorageKey(
  goal: SavingsGoal,
  fallbackProfileId: string,
): { profileId: string; goalId: string } {
  const profileId = resolveGoalProfileId(goal, fallbackProfileId)
  if (goal.sourceProfileId) {
    const prefix = `hh-${goal.sourceProfileId}-`
    if (goal.id.startsWith(prefix)) {
      return { profileId, goalId: goal.id.slice(prefix.length) }
    }
  }
  return { profileId, goalId: goal.id }
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

/** Mål er «nådd» når det finnes et positivt målbeløp og effektiv sparing er minst like stor. */
export function isSavingsGoalCompleted(effective: number, targetAmount: number): boolean {
  return targetAmount > 0 && effective >= targetAmount
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

/** KPI for en liste sparemål (samme effektiv-sparing-logikk som på kortene). */
export function aggregateSavingsGoalsKpi(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): { totalSaved: number; totalTarget: number; progressPct: number } {
  const totalSaved = getTotalEffectiveSaved(goals, transactions, budgetCategories, fallbackProfileId)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const progressPct = Math.round(calcProgress(totalSaved, totalTarget))
  return { totalSaved, totalTarget, progressPct }
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

/** Kalenderdager til måldato (kan være negativ hvis dato er passert). */
export function calendarDaysUntilTarget(isoDate: string, nowMs = Date.now()): number | null {
  const part = isoDate.split('T')[0]
  if (!part) return null
  const bits = part.split('-').map(Number)
  if (bits.length !== 3 || bits.some((n) => !Number.isFinite(n))) return null
  const [y, m, d] = bits
  const target = new Date(y!, m! - 1, d!)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date(nowMs)
  const td = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - td.getTime()) / 86400000)
}

export type SavingsGoalPaceStatus = 'no_date' | 'goal_met' | 'past_date' | 'ok'

export type SavingsGoalPaceSummary = {
  status: SavingsGoalPaceStatus
  hasTargetDate: boolean
  /** Gjenværende kroner til mål (aldri negativ). */
  remainingNok: number
  /** Dager igjen til måldato i kalender; `null` uten dato; 0 når frist passert (status past_date). */
  daysLeft: number | null
  weeklyNok: number | null
  monthlyNok: number | null
}

/**
 * Lineært «sparetempo» (snitt per uke/måned) ut fra gjenværende beløp og kalenderdager til måldato.
 * Brukes i sparemål-modal; ikke prognose, kun jevn fordeling.
 */
export function buildSavingsGoalPaceSummary(
  remainingToTargetNok: number,
  targetDate: string | undefined | null,
  nowMs = Date.now(),
): SavingsGoalPaceSummary {
  const remainingNok = Math.max(0, remainingToTargetNok)
  const rawDate = targetDate?.trim() ?? ''

  if (!rawDate) {
    return {
      status: 'no_date',
      hasTargetDate: false,
      remainingNok,
      daysLeft: null,
      weeklyNok: null,
      monthlyNok: null,
    }
  }

  const diffDays = calendarDaysUntilTarget(rawDate, nowMs)
  if (diffDays === null) {
    return {
      status: 'no_date',
      hasTargetDate: false,
      remainingNok,
      daysLeft: null,
      weeklyNok: null,
      monthlyNok: null,
    }
  }

  if (remainingNok <= 0) {
    return {
      status: 'goal_met',
      hasTargetDate: true,
      remainingNok: 0,
      daysLeft: Math.max(0, diffDays),
      weeklyNok: null,
      monthlyNok: null,
    }
  }

  if (diffDays < 0) {
    return {
      status: 'past_date',
      hasTargetDate: true,
      remainingNok,
      daysLeft: 0,
      weeklyNok: null,
      monthlyNok: null,
    }
  }

  const denomDays = Math.max(diffDays, 1)
  const weeklyNok = Math.round((remainingNok * 7) / denomDays)
  const daysPerMonth = 365.25 / 12
  const monthlyNok = Math.round((remainingNok * daysPerMonth) / denomDays)

  return {
    status: 'ok',
    hasTargetDate: true,
    remainingNok,
    daysLeft: diffDays,
    weeklyNok,
    monthlyNok,
  }
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
        (t.profileId ?? pid) === pid,
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
