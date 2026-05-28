import type { ParentCategory } from '@/lib/budgetCategoryCatalog'

export type ActionKind = 'budget' | 'transaction'

export type BudgetPeriod =
  | { mode: 'monthly_all' }
  | { mode: 'single_month'; month: number }
  | { mode: 'month_range'; from: number; to: number }
  | { mode: 'months'; months: number[] }

export type ProposedBudgetAction = {
  kind: 'budget'
  categoryName: string
  parentCategory: ParentCategory
  amountNok: number
  period: BudgetPeriod
  budgetYear: number
  createLineIfMissing?: boolean
}

export type ProposedTransactionAction = {
  kind: 'transaction'
  date: string
  description: string
  amountNok: number
  categoryName: string
  type: 'income' | 'expense'
  subcategory?: string
  plannedFollowUp?: boolean
  incomeIsNet?: boolean
  incomeWithholdingPercent?: number
}

export type ProposedAction = ProposedBudgetAction | ProposedTransactionAction

export type ActionBlockReason =
  | 'household_readonly'
  | 'wrong_profile_mentioned'
  | 'year_not_active'
  | 'year_archived_readonly'
  | 'invalid_amount'
  | 'missing_category'
  | 'subscription_managed_line'
  | 'invalid_action'
  | 'invalid_date'

export type ValidatedBudgetAction = {
  kind: 'budget'
  blocked: false
  profileId: string
  profileName: string
  categoryName: string
  parentCategory: ParentCategory
  lineLabel: string
  amountNok: number
  period: BudgetPeriod
  periodLabel: string
  budgetYear: number
  resolvedCategoryId: string | null
  isNewLine: boolean
  previousAmountNok: number | null
  createLineIfMissing: boolean
  subscriptionWarning: boolean
  payload: ProposedBudgetAction
}

export type ValidatedTransactionAction = {
  kind: 'transaction'
  blocked: false
  profileId: string
  profileName: string
  date: string
  dateLabel: string
  description: string
  amountNok: number
  categoryName: string
  typeLabel: string
  lineLabel: string
  plannedFollowUp: boolean
  payload: ProposedTransactionAction
}

export type BlockedAction = {
  blocked: true
  reason: ActionBlockReason
  message: string
}

export type ValidatedAction = ValidatedBudgetAction | ValidatedTransactionAction | BlockedAction

export type AppliedBudgetSummary = {
  kind: 'budget'
  profileName: string
  lineLabel: string
  amountLabel: string
  periodLabel: string
  budgetYear: number
  isNewLine: boolean
}

export type AppliedTransactionSummary = {
  kind: 'transaction'
  profileName: string
  dateLabel: string
  description: string
  amountLabel: string
  lineLabel: string
  plannedFollowUp: boolean
}

export type AppliedActionSummary = AppliedBudgetSummary | AppliedTransactionSummary

export type ActionStatus = 'pending' | 'confirmed' | 'cancelled' | 'edited'

export const PARENT_CATEGORY_LABELS: Record<ParentCategory, string> = {
  inntekter: 'Inntekter',
  regninger: 'Regninger',
  utgifter: 'Utgifter',
  gjeld: 'Gjeld',
  sparing: 'Sparing',
}

export const MONTH_NAMES_NB = [
  'jan',
  'feb',
  'mar',
  'apr',
  'mai',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'des',
] as const
