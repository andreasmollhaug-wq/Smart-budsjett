import { shouldRegisterCustomLabel, buildZeroBudgetCategory } from '@/lib/createBudgetCategoryZero'
import { buildBudgetedFromPeriod } from '@/lib/dottirAiActions/periodLabels'
import { toAppliedBudgetSummary } from '@/lib/dottirAiActions/validate'
import type { AppliedBudgetSummary, ValidatedBudgetAction } from '@/lib/dottirAiActions/types'
import type { BudgetCategory, LabelLists } from '@/lib/store'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import { useStore } from '@/lib/store'

export type ApplyBudgetStore = Pick<
  ReturnType<typeof useStore.getState>,
  | 'activeProfileId'
  | 'people'
  | 'addBudgetCategory'
  | 'updateBudgetCategory'
  | 'addCustomBudgetLabel'
  | 'recalcBudgetSpent'
>

export function applyDottirAiBudgetAction(
  store: ApplyBudgetStore,
  action: ValidatedBudgetAction,
): AppliedBudgetSummary {
  const profileId = store.activeProfileId
  const person = store.people[profileId]
  if (!person) throw new Error('Aktiv profil mangler')

  const categories = person.budgetCategories ?? []
  let category: BudgetCategory | undefined = action.resolvedCategoryId
    ? categories.find((c) => c.id === action.resolvedCategoryId)
    : undefined

  if (!category && action.createLineIfMissing) {
    const labelLists: LabelLists = {
      hiddenBudgetLabels: person.hiddenBudgetLabels ?? emptyLabelLists().hiddenBudgetLabels,
      customBudgetLabels: person.customBudgetLabels ?? emptyLabelLists().customBudgetLabels,
    }
    if (shouldRegisterCustomLabel(action.parentCategory, action.categoryName, labelLists.customBudgetLabels)) {
      store.addCustomBudgetLabel(action.parentCategory, action.categoryName)
    }
    const type = action.parentCategory === 'inntekter' ? 'income' : 'expense'
    const newCat = buildZeroBudgetCategory(
      action.categoryName,
      action.parentCategory,
      type,
      categories.length,
    )
    store.addBudgetCategory(newCat)
    category = newCat
  }

  if (!category) {
    throw new Error(`Fant ikke budsjettlinje «${action.categoryName}»`)
  }

  const existingBudgeted = Array.isArray(category.budgeted) ? category.budgeted : Array(12).fill(0)
  const budgeted = buildBudgetedFromPeriod(action.period, action.amountNok, existingBudgeted)

  store.updateBudgetCategory(category.id, {
    budgeted,
    frequency: action.period.mode === 'monthly_all' ? 'monthly' : category.frequency,
  })
  store.recalcBudgetSpent(category.name)

  return toAppliedBudgetSummary(action)
}
