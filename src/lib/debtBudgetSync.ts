import type { BudgetCategory, Debt, PersonData, Transaction } from '@/lib/store'
import { debtColors } from '@/lib/debtDisplay'
import {
  debtRepaymentFirstEligibleDay,
  isDebtBudgetMonthPaying,
  rawDebtMonthlyPayment,
} from '@/lib/debtHelpers'
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

/** 12 måneders budsjettbeløp for synket gjeld: «synk fra måned» + pause per kalendermåned i budsjettår. */
export function buildDebtLinkedBudgetedTwelve(debt: Debt, budgetYear: number, syncFromMonth1: number): number[] {
  const start = clampSyncBudgetFromMonth1(syncFromMonth1)
  const base = rawDebtMonthlyPayment(debt)
  return Array.from({ length: 12 }, (_, i) => {
    const month1 = i + 1
    if (month1 < start) return 0
    if (base <= 0) return 0
    return isDebtBudgetMonthPaying(debt, budgetYear, month1) ? base : 0
  })
}

function plannedDebtIsoOnOrAfterResume(
  budgetYear: number,
  month1: number,
  billingDay: number,
  resume: Date | null,
): string {
  const clampedDay = clampBillingDay(billingDay)
  const scheduled = formatBudgetDateIso(budgetYear, month1, clampedDay)
  if (resume === null) return scheduled
  const tSched = new Date(scheduled + 'T12:00:00').getTime()
  const tRes = resume.getTime()
  const t = Math.max(tSched, tRes)
  const d = new Date(t)
  const y = d.getFullYear()
  const mo = d.getMonth() + 1
  const da = d.getDate()
  return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
}

/** Planlagte trekk for et budsjettår når gjeld er synket (én rad per måned med beløp > 0). */
export function buildSyncedDebtPlannedTransactionsForYear(
  debt: Debt,
  categoryName: string,
  profileId: string,
  budgetYear: number,
): Transaction[] {
  const startM = clampSyncBudgetFromMonth1(debt.syncBudgetFromMonth1 ?? 1)
  const budgetedTwelve = buildDebtLinkedBudgetedTwelve(debt, budgetYear, startM)
  const resume = debtRepaymentFirstEligibleDay(debt)
  const dayRaw = clampPlannedPaymentDay(debt.plannedPaymentDayOfMonth)
  const desc = `${debt.name.trim() || 'Avdrag'} (planlagt)`
  const out: Transaction[] = []
  for (let m = 1; m <= 12; m++) {
    const amt = budgetedTwelve[m - 1] ?? 0
    if (amt <= 0) continue
    out.push({
      id: generateId(),
      date: plannedDebtIsoOnOrAfterResume(budgetYear, m, dayRaw, resume),
      description: desc,
      amount: amt,
      category: categoryName,
      type: 'expense',
      profileId,
      linkedDebtId: debt.id,
    })
  }
  return out
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
  color: string,
  budgetedTwelve: number[],
): BudgetCategory {
  const budgeted =
    budgetedTwelve.length === 12 ? [...budgetedTwelve] : Array.from({ length: 12 }, (_, i) => budgetedTwelve[i] ?? 0)
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

/** Idempotent: fjern planlagte trekk for året, legg inn nye for alle synkede gjeld. */
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
    transactions = stripLinkedDebtTransactionsForYear(transactions, debt.id, budgetYear)
    const extra = buildSyncedDebtPlannedTransactionsForYear(debt, cat.name, profileId, budgetYear)
    transactions = [...extra, ...transactions]
  }
  return { ...person, transactions }
}

/** Etter nytt budsjettår: gjeld-linjer får månedlige beløp fra pause-/synk-logikk. */
export function normalizeDebtLinkedBudgetCategoriesToFullYear(
  person: PersonData,
  budgetYear: number,
): PersonData {
  const budgetCategories = person.budgetCategories.map((c) => {
    const debt = person.debts.find((d) => d.syncToBudget && d.linkedBudgetCategoryId === c.id)
    if (!debt) return c
    const startM = clampSyncBudgetFromMonth1(debt.syncBudgetFromMonth1 ?? 1)
    const budgeted = buildDebtLinkedBudgetedTwelve(debt, budgetYear, startM)
    return { ...c, budgeted }
  })
  return { ...person, budgetCategories }
}
