import type { BudgetCategory, Debt, PersonData, Transaction } from '@/lib/store'
import { debtColors } from '@/lib/debtDisplay'
import { isDebtPauseActive } from '@/lib/debtHelpers'
import { budgetedTwelveFromMonthly } from '@/lib/serviceSubscriptionHelpers'
import { generateId } from '@/lib/utils'
import {
  clampBillingDay,
  formatBudgetDateIso,
  inclusiveMonthRangeInYear,
  parseIsoYearMonth,
} from '@/lib/subscriptionTransactions'

export function uniqueGjeldName(desired: string, categoryNames: string[]): string {
  const trimmed = desired.trim() || 'Gjeld'
  const names = new Set(categoryNames)
  if (!names.has(trimmed)) return trimmed
  let i = 2
  while (names.has(`${trimmed} (${i})`)) i += 1
  return `${trimmed} (${i})`
}

export function effectiveDebtMonthlyPayment(debt: Debt): number {
  if (isDebtPauseActive(debt)) return 0
  const m = debt.monthlyPayment
  return Number.isFinite(m) && m >= 0 ? m : 0
}

export function debtColorForType(type: Debt['type']): string {
  return debtColors[type] ?? '#868E96'
}

/** Måned 1–12 for synk til budsjett; ugyldig/manglende → 1. */
export function clampSyncBudgetFromMonth1(m: number | undefined): number {
  const x = Math.floor(m ?? 1)
  if (!Number.isFinite(x)) return 1
  return Math.min(12, Math.max(1, x))
}

/** Standard: inneværende måned hvis budsjettår = kalenderår, ellers januar. */
export function defaultSyncBudgetFromMonth1ForBudgetYear(
  budgetYear: number,
  now: Date = new Date(),
): number {
  if (budgetYear === now.getFullYear()) return now.getMonth() + 1
  return 1
}

/** Jan–des: 0 før startmåned, deretter `monthly` (indeks 0 = januar). */
export function budgetedFromMonthlyFromMonth(monthly: number, startMonth1: number): number[] {
  const start = clampSyncBudgetFromMonth1(startMonth1)
  const amt = Number.isFinite(monthly) && monthly >= 0 ? monthly : 0
  return Array.from({ length: 12 }, (_, i) => (i < start - 1 ? 0 : amt))
}

export function buildBudgetCategoryForDebt(
  categoryId: string,
  displayName: string,
  monthly: number,
  color: string,
  startMonth1: number,
): BudgetCategory {
  const budgeted = budgetedFromMonthlyFromMonth(monthly, startMonth1)
  return {
    id: categoryId,
    name: displayName,
    budgeted,
    spent: 0,
    type: 'expense',
    color,
    parentCategory: 'gjeld',
    frequency: 'monthly',
  }
}

export type PlannedDebtTxParams = {
  debtId: string
  label: string
  categoryName: string
  profileId: string
  amountMonthly: number
  budgetYear: number
  startMonth1: number
  endMonth1: number
  dayOfMonth: number
}

export function buildPlannedDebtTransactions(p: PlannedDebtTxParams): Transaction[] {
  const monthly = Number.isFinite(p.amountMonthly) && p.amountMonthly >= 0 ? p.amountMonthly : 0
  if (monthly <= 0) return []
  const months = inclusiveMonthRangeInYear(p.startMonth1, p.endMonth1)
  const day = clampBillingDay(p.dayOfMonth)
  const desc = `${p.label.trim() || 'Avdrag'} (planlagt)`
  return months.map((row) => ({
    id: generateId(),
    date: formatBudgetDateIso(p.budgetYear, row.month1, day),
    description: desc,
    amount: monthly,
    category: p.categoryName,
    type: 'expense' as const,
    profileId: p.profileId,
    linkedDebtId: p.debtId,
  }))
}

export function stripLinkedDebtTransactionsForYear(
  transactions: Transaction[],
  debtId: string,
  year: number,
): Transaction[] {
  return transactions.filter((t) => {
    if (t.linkedDebtId !== debtId) return true
    const parsed = parseIsoYearMonth(t.date)
    if (!parsed) return true
    return parsed.year !== year
  })
}

export function stripAllLinkedDebtTransactions(transactions: Transaction[], debtId: string): Transaction[] {
  return transactions.filter((t) => t.linkedDebtId !== debtId)
}

export function clampPlannedPaymentDay(day: number | undefined): number {
  const d = Math.floor(day ?? 1)
  return clampBillingDay(d)
}

/** Idempotent: fjern planlagte trekk for året, legg inn 12 nye måneder for alle synkede gjeld. */
export function appendDebtPlannedTransactionsForBudgetYear(
  person: PersonData,
  budgetYear: number,
  profileId: string,
): PersonData {
  let transactions = person.transactions
  for (const debt of person.debts) {
    if (!debt.syncPlannedTransactions || !debt.syncToBudget || !debt.linkedBudgetCategoryId) continue
    const cat = person.budgetCategories.find((c) => c.id === debt.linkedBudgetCategoryId)
    if (!cat) continue
    const monthly = effectiveDebtMonthlyPayment(debt)
    transactions = stripLinkedDebtTransactionsForYear(transactions, debt.id, budgetYear)
    const day = clampPlannedPaymentDay(debt.plannedPaymentDayOfMonth)
    if (monthly <= 0) continue
    const extra = buildPlannedDebtTransactions({
      debtId: debt.id,
      label: debt.name,
      categoryName: cat.name,
      profileId,
      amountMonthly: monthly,
      budgetYear,
      startMonth1: 1,
      endMonth1: 12,
      dayOfMonth: day,
    })
    transactions = [...extra, ...transactions]
  }
  return { ...person, transactions }
}

/** Etter nytt budsjettår: gjeld-linjer får fullt års månedlig beløp (ikke arve delår med nuller). */
export function normalizeDebtLinkedBudgetCategoriesToFullYear(person: PersonData): PersonData {
  const budgetCategories = person.budgetCategories.map((c) => {
    const debt = person.debts.find((d) => d.syncToBudget && d.linkedBudgetCategoryId === c.id)
    if (!debt) return c
    const monthly = effectiveDebtMonthlyPayment(debt)
    const budgeted = budgetedTwelveFromMonthly(monthly)
    return { ...c, budgeted }
  })
  return { ...person, budgetCategories }
}
