import type { BudgetCategory, PersonData } from '@/lib/store'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'

function labelListsForPerson(person: {
  customBudgetLabels?: Record<ParentCategory, string[]>
  hiddenBudgetLabels?: Record<ParentCategory, string[]>
}) {
  const empty = emptyLabelLists()
  return {
    customBudgetLabels: person.customBudgetLabels ?? empty.customBudgetLabels,
    hiddenBudgetLabels: person.hiddenBudgetLabels ?? empty.hiddenBudgetLabels,
  }
}

export function getPickerCategoriesForPerson(person: PersonData): BudgetCategory[] {
  return mergeBudgetCategoriesForTransactionPicker(
    person.budgetCategories,
    labelListsForPerson(person),
  )
}
