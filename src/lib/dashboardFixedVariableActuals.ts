import { transactionInMonthRange } from '@/lib/dashboardOverviewHelpers'
import type { BudgetCategory, Transaction } from '@/lib/store'

/** Map kategorinavn → budsjettkategori (siste treff vinner ved duplikatnavn). */
export function buildBudgetCategoryByNameMap(categories: BudgetCategory[]): Map<string, BudgetCategory> {
  const m = new Map<string, BudgetCategory>()
  for (const c of categories) {
    m.set(c.name, c)
  }
  return m
}

/**
 * Fordeler faktiske utgifter i perioden i «faste» vs «variable» ut fra:
 * - Fest: kategori har budsjettfrekvens `monthly`, ELLER transaksjon har `linkedServiceSubscriptionId` eller `linkedDebtId`
 * - Variabelt: øvrige utgifter i perioden
 */
export function summarizeFixedVariableExpenseActuals(
  transactions: Transaction[],
  filterYear: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
  budgetCategories: BudgetCategory[],
): { fixed: number; variable: number; totalExpense: number } {
  const byName = buildBudgetCategoryByNameMap(budgetCategories)
  let fixed = 0
  let variable = 0

  for (const t of transactions) {
    if (t.type !== 'expense') continue
    if (!transactionInMonthRange(t, filterYear, monthStartInclusive, monthEndInclusive)) continue
    const amt = typeof t.amount === 'number' && Number.isFinite(t.amount) ? t.amount : 0
    if (amt <= 0) continue

    let isFixed = false
    if (t.linkedServiceSubscriptionId || t.linkedDebtId) {
      isFixed = true
    } else {
      const catName = typeof t.category === 'string' && t.category.trim() ? t.category.trim() : ''
      const bc = catName ? byName.get(catName) : undefined
      if (bc && bc.type === 'expense' && bc.frequency === 'monthly') {
        isFixed = true
      }
    }

    if (isFixed) fixed += amt
    else variable += amt
  }

  return { fixed, variable, totalExpense: fixed + variable }
}
