import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'

export type ApplyDedicatedSparingHooks = {
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  addBudgetCategory: (c: BudgetCategory) => void
}
import {
  buildZeroBudgetCategory,
  shouldRegisterCustomLabel,
} from '@/lib/createBudgetCategoryZero'

/** Nedtrekksverdi for «opprett egen Sparing-linje med samme navn som målet». */
export const SPARING_LINK_NEW_DEDICATED = '__new_dedicated__'

export type DedicatedSparingBudgetResult =
  | { kind: 'existing'; categoryId: string }
  | { kind: 'create'; category: BudgetCategory; shouldAddCustomLabel: boolean }

/**
 * Finn eksisterende Sparing-utgiftslinje med gitt navn, eller bygg ny (null hvis tomt navn).
 */
export function resolveDedicatedSparingBudgetCategory(
  lineName: string,
  budgetCategories: BudgetCategory[],
  customBudgetLabels: Record<ParentCategory, string[]>,
): DedicatedSparingBudgetResult | null {
  const trimmed = lineName.trim()
  if (!trimmed) return null

  const existing = budgetCategories.find(
    (c) => c.parentCategory === 'sparing' && c.type === 'expense' && c.name === trimmed,
  )
  if (existing) return { kind: 'existing', categoryId: existing.id }

  const category = buildZeroBudgetCategory(trimmed, 'sparing', 'expense', budgetCategories.length)
  const shouldAddCustomLabel = shouldRegisterCustomLabel('sparing', trimmed, customBudgetLabels)
  return { kind: 'create', category, shouldAddCustomLabel }
}

/**
 * Gjenbruk eller opprett Sparing-linje og returner id + kategorinavn for baseline (transaksjonssum).
 */
export function applyDedicatedSparingCategory(
  lineName: string,
  budgetCategories: BudgetCategory[],
  customBudgetLabels: Record<ParentCategory, string[]>,
  hooks: ApplyDedicatedSparingHooks,
): { linkedId: string; categoryNameForBaseline: string } | null {
  const res = resolveDedicatedSparingBudgetCategory(lineName, budgetCategories, customBudgetLabels)
  if (!res) return null
  if (res.kind === 'existing') {
    return { linkedId: res.categoryId, categoryNameForBaseline: lineName.trim() }
  }
  if (res.shouldAddCustomLabel) hooks.addCustomBudgetLabel('sparing', res.category.name)
  hooks.addBudgetCategory(res.category)
  return { linkedId: res.category.id, categoryNameForBaseline: res.category.name }
}
