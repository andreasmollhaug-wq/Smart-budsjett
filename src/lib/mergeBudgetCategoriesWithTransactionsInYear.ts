import { REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import { resolveCategoryGroupAndType, type LabelLists } from '@/lib/budgetCategoryCatalog'
import { buildZeroBudgetCategory } from '@/lib/createBudgetCategoryZero'
import type { BudgetCategory, Transaction } from '@/lib/store'

function categoryTypeKey(name: string, type: 'income' | 'expense'): string {
  return `${name.trim()}\u0000${type}`
}

function compareOverviewCategory(a: BudgetCategory, b: BudgetCategory): number {
  const ra = REPORT_GROUP_ORDER.indexOf(a.parentCategory)
  const rb = REPORT_GROUP_ORDER.indexOf(b.parentCategory)
  const na = ra === -1 ? 999 : ra
  const nb = rb === -1 ? 999 : rb
  if (na !== nb) return na - nb
  return a.name.localeCompare(b.name, 'nb')
}

/**
 * For «Faktisk oversikt»: budsjettlinjer (evt. arkiv) pluss kategorier som kun finnes på
 * transaksjoner i kalenderåret — uten krav til at brukeren har opprettet budsjettlinjer.
 */
export function mergeBudgetCategoriesWithTransactionsInYear(
  budgetCategories: BudgetCategory[],
  transactions: Transaction[],
  year: number,
  labelLists: LabelLists,
): BudgetCategory[] {
  const covered = new Set<string>()
  for (const c of budgetCategories) {
    const n = c.name.trim()
    if (!n) continue
    covered.add(categoryTypeKey(n, c.type))
  }

  const extras: BudgetCategory[] = []
  let synthIx = 0

  for (const t of transactions) {
    if (!t.date || t.date.length < 7) continue
    const yy = Number(t.date.slice(0, 4))
    if (!Number.isFinite(yy) || yy !== year) continue

    const name = String(t.category ?? '').trim()
    if (!name) continue

    const key = categoryTypeKey(name, t.type)
    if (covered.has(key)) continue

    const { parentCategory, type } = resolveCategoryGroupAndType(name, t.type, labelLists)
    const cat = buildZeroBudgetCategory(name, parentCategory, type, budgetCategories.length + synthIx)
    covered.add(key)
    extras.push(cat)
    synthIx++
  }

  extras.sort(compareOverviewCategory)

  if (budgetCategories.length === 0) return extras

  return [...budgetCategories, ...extras]
}
