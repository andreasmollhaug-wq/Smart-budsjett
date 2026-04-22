import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { buildZeroBudgetCategory, shouldRegisterCustomLabel } from '@/lib/createBudgetCategoryZero'
import type { BudgetCategory } from '@/lib/store'
import { uniqueRegningerName } from '@/lib/serviceSubscriptionHelpers'

/** Standardnavn for auto-valg «Streaming» i abonnement-nedtrekket. */
export const SUBSCRIPTION_SHARED_AUTO_STREAMING_NAME = 'Streaming'

/** Navn for auto-valg «Abonnementer» (matcher abonnement-filter i regningerCategoryPicker). */
export const SUBSCRIPTION_SHARED_AUTO_ABONNEMENT_NAME = 'Abonnementer'

/** Navn for auto-valg «Medlemskap» (matcher medlemskap-filter i regningerCategoryPicker). */
export const SUBSCRIPTION_SHARED_AUTO_MEDLEMSKAP_NAME = 'Medlemskap'

export const AUTO_SELECT_TV_STREAMING_VALUE = '__auto_tv_streaming__'
export const AUTO_SELECT_ABONNEMENTER_VALUE = '__auto_abonnementer__'
export const AUTO_SELECT_MEDLEMSKAP_VALUE = '__auto_medlemskap__'

export function desiredNameForAutoSelectValue(value: string): string | undefined {
  if (value === AUTO_SELECT_TV_STREAMING_VALUE) return SUBSCRIPTION_SHARED_AUTO_STREAMING_NAME
  if (value === AUTO_SELECT_ABONNEMENTER_VALUE) return SUBSCRIPTION_SHARED_AUTO_ABONNEMENT_NAME
  if (value === AUTO_SELECT_MEDLEMSKAP_VALUE) return SUBSCRIPTION_SHARED_AUTO_MEDLEMSKAP_NAME
  return undefined
}

/**
 * Finner eller oppretter en Regninger-linje med ønsket navn (unikt ved kollisjon).
 * Returnerer kategori-id.
 */
export function ensureSubscriptionSharedRegningerLine(
  desiredName: string,
  budgetCategories: BudgetCategory[],
  addBudgetCategory: (c: BudgetCategory) => void,
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void,
  customBudgetLabels: Record<ParentCategory, string[]>,
): string {
  const trimmed = desiredName.trim()
  const regninger = budgetCategories.filter((c) => c.parentCategory === 'regninger')
  const exact = regninger.find((c) => c.name === trimmed)
  if (exact) return exact.id

  const finalName = uniqueRegningerName(trimmed, budgetCategories.map((c) => c.name))
  const parent: ParentCategory = 'regninger'
  if (shouldRegisterCustomLabel(parent, finalName, customBudgetLabels)) {
    addCustomBudgetLabel(parent, finalName)
  }
  const cat = buildZeroBudgetCategory(finalName, parent, 'expense', budgetCategories.length)
  addBudgetCategory(cat)
  return cat.id
}
