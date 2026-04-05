import { DEFAULT_STANDARD_LABELS, type ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import { generateId } from '@/lib/utils'

export const BUDGET_CATEGORY_COLORS = [
  '#3B5BDB',
  '#4C6EF5',
  '#7048E8',
  '#AE3EC9',
  '#E03131',
  '#F08C00',
  '#0CA678',
  '#0B7285',
]

export function shouldRegisterCustomLabel(
  parent: ParentCategory,
  name: string,
  customLabels: Record<ParentCategory, string[]>,
): boolean {
  const n = name.trim()
  if (!n) return false
  if (DEFAULT_STANDARD_LABELS[parent].includes(n)) return false
  if ((customLabels[parent] ?? []).includes(n)) return false
  return true
}

export function buildZeroBudgetCategory(
  name: string,
  parent: ParentCategory,
  type: 'income' | 'expense',
  existingCategoryCount: number,
): BudgetCategory {
  const trimmed = name.trim()
  return {
    id: generateId(),
    name: trimmed,
    budgeted: Array(12).fill(0),
    spent: 0,
    type,
    color: BUDGET_CATEGORY_COLORS[existingCategoryCount % BUDGET_CATEGORY_COLORS.length],
    parentCategory: parent,
    frequency: 'monthly',
  }
}
