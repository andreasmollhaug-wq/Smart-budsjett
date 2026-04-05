import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import {
  getEffectiveCurrentAmount,
  getGoalActivityRows,
  getLinkedCategoryName,
  getPortfolioSharePercent,
  getTotalEffectiveSaved,
} from '@/lib/savingsDerived'
import { calcProgress } from '@/lib/utils'

export const SAVINGS_REPORT_ACTIVITY_LIMIT = 20

export interface SavingsGoalReportRow {
  goal: SavingsGoal
  effectiveCurrent: number
  targetAmount: number
  progressPct: number
  remaining: number
  targetDateLabel: string
  linkedLabel: string
  portfolioSharePct: number
}

export interface SavingsReportKpis {
  goalsCount: number
  totalSaved: number
  totalTarget: number
  overallProgressPct: number
  totalRemaining: number
}

export interface SavingsReportActivityItem {
  kind: 'transaction' | 'deposit'
  date: string
  amount: number
  label: string
}

export interface SavingsReportGoalActivity {
  goalId: string
  goalName: string
  items: SavingsReportActivityItem[]
}

export interface SavingsReportData {
  kpis: SavingsReportKpis
  rows: SavingsGoalReportRow[]
  activities: SavingsReportGoalActivity[]
  showPortfolioShare: boolean
}

export function buildSavingsReportData(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  activeProfileId: string,
  activityLimit = SAVINGS_REPORT_ACTIVITY_LIMIT,
): SavingsReportData {
  if (goals.length === 0) {
    return {
      kpis: {
        goalsCount: 0,
        totalSaved: 0,
        totalTarget: 0,
        overallProgressPct: 0,
        totalRemaining: 0,
      },
      rows: [],
      activities: [],
      showPortfolioShare: false,
    }
  }

  const totalSaved = getTotalEffectiveSaved(goals, transactions, budgetCategories, activeProfileId)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalRemaining = goals.reduce((s, g) => {
    const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, activeProfileId)
    return s + Math.max(0, g.targetAmount - eff)
  }, 0)

  const overallProgressPct =
    totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0

  const rows: SavingsGoalReportRow[] = goals.map((goal) => {
    const effectiveCurrent = getEffectiveCurrentAmount(goal, transactions, budgetCategories, activeProfileId)
    const progressPct = calcProgress(effectiveCurrent, goal.targetAmount)
    const linkedName = getLinkedCategoryName(goal, budgetCategories)
    const linkedLabel = linkedName ?? 'Manuelt / ikke koblet'
    const portfolioSharePct = getPortfolioSharePercent(
      goal,
      goals,
      transactions,
      budgetCategories,
      activeProfileId,
    )
    const targetDateLabel = goal.targetDate
      ? new Date(goal.targetDate).toLocaleDateString('nb-NO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—'

    return {
      goal,
      effectiveCurrent,
      targetAmount: goal.targetAmount,
      progressPct,
      remaining: Math.max(0, goal.targetAmount - effectiveCurrent),
      targetDateLabel,
      linkedLabel,
      portfolioSharePct,
    }
  })

  const activities: SavingsReportGoalActivity[] = goals.map((goal) => {
    const raw = getGoalActivityRows(goal, transactions, budgetCategories, activeProfileId)
    const sliced = raw.slice(0, activityLimit)
    const items: SavingsReportActivityItem[] = sliced.map((row) => {
      if (row.kind === 'transaction') {
        return {
          kind: 'transaction' as const,
          date: row.tx.date,
          amount: row.tx.amount,
          label: row.tx.description?.trim() || row.tx.category,
        }
      }
      return {
        kind: 'deposit' as const,
        date: row.date,
        amount: row.amount,
        label: row.note?.trim() || 'Innskudd',
      }
    })
    return { goalId: goal.id, goalName: goal.name, items }
  })

  const showPortfolioShare = goals.length >= 2 && totalSaved > 0

  return {
    kpis: {
      goalsCount: goals.length,
      totalSaved,
      totalTarget,
      overallProgressPct,
      totalRemaining,
    },
    rows,
    activities,
    showPortfolioShare,
  }
}
