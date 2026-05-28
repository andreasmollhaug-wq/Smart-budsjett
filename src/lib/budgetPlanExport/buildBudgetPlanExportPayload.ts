import { REPORT_GROUP_LABELS, REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { effectiveBudgetedIncomeMonth } from '@/lib/incomeWithholding'
import type { BudgetCategory } from '@/lib/store'
import { formatPercent } from '@/lib/utils'
import { formatBudgetPlanFrequency } from './formatBudgetPlanFrequency'
import type {
  BudgetExportLayout,
  BudgetPlanExportRow,
  BudgetPlanKpis,
  BudgetPlanScopePayload,
} from './types'

const COST_GROUPS: ParentCategory[] = ['regninger', 'utgifter', 'gjeld', 'sparing']

function emptyRowsByGroup(): Record<ParentCategory, BudgetPlanExportRow[]> {
  return {
    inntekter: [],
    regninger: [],
    utgifter: [],
    gjeld: [],
    sparing: [],
  }
}

function ensureBudgetedArray(budgeted: number[] | undefined): number[] {
  if (Array.isArray(budgeted) && budgeted.length === 12) return budgeted
  return Array(12).fill(0)
}

function monthValuesForCategory(c: BudgetCategory): number[] {
  if (c.parentCategory === 'inntekter' && c.type === 'income') {
    return Array.from({ length: 12 }, (_, i) => effectiveBudgetedIncomeMonth(c, i))
  }
  const arr = ensureBudgetedArray(c.budgeted)
  return Array.from({ length: 12 }, (_, i) => arr[i] ?? 0)
}

export type BuildBudgetPlanExportPayloadOptions = {
  layout: BudgetExportLayout
  monthIndex: number
  onlyLinesWithAmounts: boolean
  scopeLabel: string
}

export function buildBudgetPlanExportPayload(
  categories: BudgetCategory[],
  options: BuildBudgetPlanExportPayloadOptions,
): BudgetPlanScopePayload {
  const { layout, monthIndex, onlyLinesWithAmounts, scopeLabel } = options
  const rows: BudgetPlanExportRow[] = []
  const rowsByGroup = emptyRowsByGroup()

  let budgetedIncome = 0
  let budgetedExpense = 0

  for (const c of categories) {
    const months = monthValuesForCategory(c)
    const yearTotal = months.reduce((a, b) => a + b, 0)
    const displayAmount = layout === 'singleMonth' ? months[monthIndex] ?? 0 : yearTotal

    if (onlyLinesWithAmounts) {
      if (layout === 'singleMonth' && displayAmount === 0) continue
      if (layout === 'fullYear' && yearTotal === 0) continue
    }

    if (c.parentCategory === 'inntekter' && c.type === 'income') {
      budgetedIncome += displayAmount
    } else if (COST_GROUPS.includes(c.parentCategory)) {
      budgetedExpense += displayAmount
    }

    const row: BudgetPlanExportRow = {
      group: c.parentCategory,
      groupLabel: REPORT_GROUP_LABELS[c.parentCategory],
      name: c.name,
      type: c.type,
      frequency: c.frequency,
      frequencyLabel: formatBudgetPlanFrequency(c.frequency),
      months,
      yearTotal,
      displayAmount,
    }
    rows.push(row)
    rowsByGroup[c.parentCategory].push(row)
  }

  for (const group of REPORT_GROUP_ORDER) {
    rowsByGroup[group].sort((a, b) => a.name.localeCompare(b.name, 'nb'))
  }

  const budgetResult = budgetedIncome - budgetedExpense
  const kpis: BudgetPlanKpis = {
    budgetedIncome,
    budgetedExpense,
    budgetResult,
    savingsRatePct:
      budgetedIncome > 0 ? formatPercent((budgetResult / budgetedIncome) * 100) : null,
  }

  return { scopeLabel, kpis, rows, rowsByGroup }
}

export function buildBudgetPlanKpis(
  categories: BudgetCategory[],
  options: Omit<BuildBudgetPlanExportPayloadOptions, 'scopeLabel'>,
): BudgetPlanKpis {
  return buildBudgetPlanExportPayload(categories, { ...options, scopeLabel: '' }).kpis
}

export function buildBudgetPlanExportRows(
  categories: BudgetCategory[],
  options: Omit<BuildBudgetPlanExportPayloadOptions, 'scopeLabel'>,
): BudgetPlanExportRow[] {
  return buildBudgetPlanExportPayload(categories, { ...options, scopeLabel: '' }).rows
}
