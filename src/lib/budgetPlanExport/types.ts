import type { LabelLists, ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import type { BudgetCategoryFrequency } from '@/lib/utils'

export type BudgetExportSubject = 'household' | 'all' | string

export type BudgetExportLayout = 'fullYear' | 'singleMonth'

export type BudgetExportScope = {
  key: 'household' | string
  label: string
  categories: BudgetCategory[]
  labelLists: LabelLists
}

export type BudgetPlanExportRow = {
  group: ParentCategory
  groupLabel: string
  name: string
  type: 'income' | 'expense'
  frequency: BudgetCategoryFrequency
  frequencyLabel: string
  months: number[]
  yearTotal: number
  displayAmount: number
}

export type BudgetPlanKpis = {
  budgetedIncome: number
  budgetedExpense: number
  budgetResult: number
  savingsRatePct: string | null
}

export type BudgetPlanScopePayload = {
  scopeLabel: string
  kpis: BudgetPlanKpis
  rows: BudgetPlanExportRow[]
  rowsByGroup: Record<ParentCategory, BudgetPlanExportRow[]>
}

export type BudgetPlanExportInput = {
  year: number
  layout: BudgetExportLayout
  monthIndex: number
  onlyLinesWithAmounts: boolean
  generatedAt: Date
  scopes: BudgetExportScope[]
}
