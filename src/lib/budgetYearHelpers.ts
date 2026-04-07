import type { BudgetCategory, Transaction } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'

function ensureBudgetedArray(budgeted: unknown): number[] {
  if (Array.isArray(budgeted)) return budgeted
  return Array(12).fill(budgeted || 0)
}

/** Summerer budsjettert inntekt for én måned (alle linjer med parentCategory inntekter). */
export function sumBudgetedIncomeForMonth(
  categories: BudgetCategory[] | undefined,
  monthIndex: number,
): number {
  if (!categories?.length) return 0
  return categories
    .filter((c) => c.parentCategory === 'inntekter')
    .reduce((sum, c) => {
      const arr = ensureBudgetedArray(c.budgeted)
      return sum + (arr[monthIndex] ?? 0)
    }, 0)
}

/**
 * Summerer budsjettert inntekt for én måned eller hele året (alle inntektslinjer).
 * Samme semantikk som Budsjett-sidens sumBudgetedForGroup('inntekter', ...).
 */
export function sumBudgetedIncomeForCategories(
  categories: BudgetCategory[] | undefined,
  mode: 'month' | 'year',
  monthIndex: number,
): number {
  if (!categories?.length) return 0
  return categories
    .filter((c) => c.parentCategory === 'inntekter')
    .reduce((sum, c) => {
      const arr = ensureBudgetedArray(c.budgeted)
      if (mode === 'month') return sum + (arr[monthIndex] ?? 0)
      return sum + arr.reduce((a, b) => a + b, 0)
    }, 0)
}

/** Budsjettert beløp per måned for én budsjettlinje (gruppe + navn) hos én profil. */
export function budgetedArrayForCategoryName(
  categories: BudgetCategory[] | undefined,
  parentCategory: ParentCategory,
  categoryName: string,
): number[] {
  const empty = Array.from({ length: 12 }, () => 0)
  if (!categories?.length) return empty
  const c = categories.find(
    (x) => x.parentCategory === parentCategory && x.name === categoryName,
  )
  if (!c) return empty
  const arr = ensureBudgetedArray(c.budgeted)
  return Array.from({ length: 12 }, (_, i) => arr[i] ?? 0)
}

/** Budsjettert beløp per måned for én inntektslinje (navn) hos én profil. */
export function budgetedArrayForIncomeCategoryName(
  categories: BudgetCategory[] | undefined,
  categoryName: string,
): number[] {
  return budgetedArrayForCategoryName(categories, 'inntekter', categoryName)
}

/** Per måned 0–11 for inntektskategorier (én profil). */
export function incomeMonthlyTotalsForCategories(
  categories: BudgetCategory[] | undefined,
): number[] {
  const out = Array.from({ length: 12 }, () => 0)
  if (!categories?.length) return out
  for (const c of categories) {
    if (c.parentCategory !== 'inntekter') continue
    const arr = ensureBudgetedArray(c.budgeted)
    for (let i = 0; i < 12; i++) out[i]! += arr[i] ?? 0
  }
  return out
}

/** Dyp kopi av budsjettkategorier (inkl. budgeted-array). */
export function cloneBudgetCategories(cats: BudgetCategory[]): BudgetCategory[] {
  return cats.map((c) => ({
    ...c,
    budgeted: Array.from({ length: 12 }, (_, i) => c.budgeted[i] ?? 0),
  }))
}

export function sumTxForCategoryInYear(
  transactions: Transaction[],
  categoryName: string,
  type: 'income' | 'expense',
  year: number,
  profileId: string,
): number {
  const prefix = `${year}-`
  return transactions
    .filter(
      (t) =>
        t.category === categoryName &&
        t.type === type &&
        t.date.startsWith(prefix) &&
        (t.profileId ?? profileId) === profileId,
    )
    .reduce((s, t) => s + t.amount, 0)
}

export function sumTxForCategoryInYearAllProfiles(
  transactions: Transaction[],
  categoryName: string,
  type: 'income' | 'expense',
  year: number,
): number {
  const prefix = `${year}-`
  return transactions
    .filter(
      (t) => t.category === categoryName && t.type === type && t.date.startsWith(prefix),
    )
    .reduce((s, t) => s + t.amount, 0)
}
