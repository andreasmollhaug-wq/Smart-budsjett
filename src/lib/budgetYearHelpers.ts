import {
  effectiveBudgetedIncomeMonth,
  effectiveIncomeTransactionAmount,
  type IncomeWithholdingRule,
} from '@/lib/incomeWithholding'
import type { BudgetCategory, PersonData, Transaction } from '@/lib/store'
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
    .reduce((sum, c) => sum + effectiveBudgetedIncomeMonth(c, monthIndex), 0)
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
  if (parentCategory === 'inntekter' && c.type === 'income') {
    return Array.from({ length: 12 }, (_, i) => effectiveBudgetedIncomeMonth(c, i))
  }
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
    for (let i = 0; i < 12; i++) out[i]! += effectiveBudgetedIncomeMonth(c, i)
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

/**
 * Bytter plass på to påfølgende budsjettlinjer innenfor samme `parentCategory`
 * i den rekkefølgen de opptrer i `cats` (andre hovedgrupper kan ligge imellom).
 * Returnerer uendret `cats` ved ugyldig flytt eller ukjent id.
 */
export function reorderBudgetCategoriesForParent(
  cats: BudgetCategory[],
  parent: ParentCategory,
  id: string,
  dir: 'up' | 'down',
): BudgetCategory[] {
  const inGroup = cats.filter((c) => c.parentCategory === parent)
  const idx = inGroup.findIndex((c) => c.id === id)
  if (idx < 0) return cats
  const newIdx = dir === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= inGroup.length) return cats
  const reordered = [...inGroup]
  ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx]!, reordered[idx]!]
  let gi = 0
  return cats.map((c) => (c.parentCategory === parent ? reordered[gi++]! : c))
}

export function sumTxForCategoryInYear(
  transactions: Transaction[],
  categoryName: string,
  type: 'income' | 'expense',
  year: number,
  profileId: string,
  incomeWithholdingDefault?: IncomeWithholdingRule | null,
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
    .reduce(
      (s, t) =>
        s +
        (type === 'income'
          ? effectiveIncomeTransactionAmount(t, incomeWithholdingDefault ?? undefined)
          : t.amount),
      0,
    )
}

export function sumTxForCategoryInYearAllProfiles(
  transactions: Transaction[],
  categoryName: string,
  type: 'income' | 'expense',
  year: number,
  people?: Record<string, PersonData>,
): number {
  const prefix = `${year}-`
  return transactions
    .filter(
      (t) => t.category === categoryName && t.type === type && t.date.startsWith(prefix),
    )
    .reduce((s, t) => {
      if (type !== 'income') return s + t.amount
      const pid = t.profileId ?? ''
      const def = people?.[pid]?.defaultIncomeWithholding
      return s + effectiveIncomeTransactionAmount(t, def)
    }, 0)
}
