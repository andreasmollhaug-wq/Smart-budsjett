import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { DEFAULT_STANDARD_LABELS } from '@/lib/budgetCategoryCatalog'
import { normalizeCategoryNameForMatch } from '@/lib/regningerCategoryPicker'
import type { BudgetCategory } from '@/lib/store'

export function findBudgetCategoryByName(
  categories: BudgetCategory[],
  parentCategory: ParentCategory,
  categoryName: string,
): BudgetCategory | undefined {
  const needle = normalizeCategoryNameForMatch(categoryName)
  if (!needle) return undefined

  const inParent = categories.filter((c) => c.parentCategory === parentCategory)
  const exact = inParent.find((c) => normalizeCategoryNameForMatch(c.name) === needle)
  if (exact) return exact

  return inParent.find((c) => normalizeCategoryNameForMatch(c.name).includes(needle))
}

/** Finn kanonisk standardnavn (f.eks. «strøm» → «Strøm»). */
export function resolveCanonicalCategoryName(
  parentCategory: ParentCategory,
  categoryName: string,
): string {
  const needle = normalizeCategoryNameForMatch(categoryName)
  if (!needle) return categoryName.trim()

  for (const label of DEFAULT_STANDARD_LABELS[parentCategory]) {
    if (normalizeCategoryNameForMatch(label) === needle) return label
  }

  const existing = categoryName.trim()
  return existing.charAt(0).toUpperCase() + existing.slice(1)
}
