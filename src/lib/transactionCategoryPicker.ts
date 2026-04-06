import {
  DEFAULT_STANDARD_LABELS,
  type LabelLists,
  type ParentCategory,
} from '@/lib/budgetCategoryCatalog'
import { buildZeroBudgetCategory } from '@/lib/createBudgetCategoryZero'
import type { BudgetCategory } from '@/lib/store'

const PARENT_ORDER: ParentCategory[] = ['inntekter', 'regninger', 'utgifter', 'gjeld', 'sparing']

function uniqueSortedStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'nb'),
  )
}

/**
 * Full liste til kategorivalg på transaksjoner: eksisterende budsjettlinjer pluss
 * standardkatalog (minus skjulte) og egendefinerte etiketter som ikke allerede har rad.
 */
export function mergeBudgetCategoriesForTransactionPicker(
  budgetCategories: BudgetCategory[],
  lists: LabelLists,
): BudgetCategory[] {
  const byName = new Map<string, BudgetCategory>()
  for (const c of budgetCategories) {
    const n = c.name.trim()
    if (!n) continue
    if (!byName.has(n)) byName.set(n, c)
  }

  let synthIx = 0
  for (const parent of PARENT_ORDER) {
    const type = parent === 'inntekter' ? 'income' : 'expense'
    const hidden = new Set(lists.hiddenBudgetLabels[parent] ?? [])
    const fromStandard = DEFAULT_STANDARD_LABELS[parent].filter((s) => !hidden.has(s))
    const custom = lists.customBudgetLabels[parent] ?? []
    const names = uniqueSortedStrings([...fromStandard, ...custom])
    for (const name of names) {
      if (byName.has(name)) continue
      const cat = buildZeroBudgetCategory(
        name,
        parent,
        type,
        budgetCategories.length + synthIx,
      )
      synthIx++
      byName.set(name, cat)
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, 'nb'))
}
