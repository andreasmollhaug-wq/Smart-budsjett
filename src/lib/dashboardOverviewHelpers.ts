import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { MONTH_LABELS_SHORT_NB } from '@/lib/bankReportData'
import type { Transaction } from '@/lib/store'

export type BudgetVsSummary = {
  budgetedIncome: number
  budgetedExpense: number
  actualIncome: number
  actualExpense: number
  budgetNet: number
  actualNet: number
  varianceNet: number
  badCount: number
  worstExpenseOvers: { name: string; variance: number }[]
}

export function summarizeBudgetVsRows(rows: BudgetVsActualRow[]): BudgetVsSummary {
  let budgetedIncome = 0
  let budgetedExpense = 0
  let actualIncome = 0
  let actualExpense = 0
  let badCount = 0
  const expenseVariances: { name: string; variance: number }[] = []

  for (const r of rows) {
    if (r.type === 'income') {
      budgetedIncome += r.budgeted
      actualIncome += r.actual
      if (r.variance < 0) badCount++
    } else {
      budgetedExpense += r.budgeted
      actualExpense += r.actual
      if (r.variance > 0) {
        badCount++
        expenseVariances.push({ name: r.name, variance: r.variance })
      }
    }
  }

  expenseVariances.sort((a, b) => b.variance - a.variance)

  const budgetNet = budgetedIncome - budgetedExpense
  const actualNet = actualIncome - actualExpense
  const varianceNet = actualNet - budgetNet

  return {
    budgetedIncome,
    budgetedExpense,
    actualIncome,
    actualExpense,
    budgetNet,
    actualNet,
    varianceNet,
    badCount,
    worstExpenseOvers: expenseVariances.slice(0, 3),
  }
}

export function transactionInMonthRange(
  t: Transaction,
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
): boolean {
  const d = t.date
  if (typeof d !== 'string' || d.length < 7) return false
  if (!d.startsWith(`${year}-`)) return false
  const mm = Number.parseInt(d.slice(5, 7), 10) - 1
  if (!Number.isFinite(mm) || mm < 0 || mm > 11) return false
  return mm >= monthStartInclusive && mm <= monthEndInclusive
}

/** Sparegrad: (inntekt − utgift) / inntekt. Null når inntekt ≤ 0 eller ugyldig. */
export function computeSavingsRatePercent(income: number, expense: number): number | null {
  if (!Number.isFinite(income) || !Number.isFinite(expense) || income <= 0) return null
  return ((income - expense) / income) * 100
}

export type SavingsRateMonthPoint = {
  monthLabel: string
  monthIndex: number
  /** null når ingen positiv inntekt den måneden */
  ratePct: number | null
}

/** Én punkt per måned i [monthStartInclusive, monthEndInclusive] for gitt år — sparegrad måned for måned. */
export function buildSavingsRateTrendForPeriod(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
): SavingsRateMonthPoint[] {
  const out: SavingsRateMonthPoint[] = []
  for (let m = monthStartInclusive; m <= monthEndInclusive; m++) {
    const { income, expense } = sumIncomeExpenseInMonthRange(transactions, year, m, m)
    out.push({
      monthLabel: MONTH_LABELS_SHORT_NB[m] ?? String(m + 1),
      monthIndex: m,
      ratePct: computeSavingsRatePercent(income, expense),
    })
  }
  return out
}

export function sumIncomeExpenseInMonthRange(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
): { income: number; expense: number } {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (!transactionInMonthRange(t, year, monthStartInclusive, monthEndInclusive)) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense }
}

/** Antall måneder i [start..end] med minst én transaksjon i året. */
export function countMonthsWithAnyTransaction(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
): { withTx: number; total: number } {
  const seen = new Set<number>()
  for (const t of transactions) {
    const d = t.date
    if (typeof d !== 'string' || d.length < 7 || !d.startsWith(`${year}-`)) continue
    const mm = Number.parseInt(d.slice(5, 7), 10) - 1
    if (!Number.isFinite(mm) || mm < monthStartInclusive || mm > monthEndInclusive) continue
    seen.add(mm)
  }
  const total = monthEndInclusive - monthStartInclusive + 1
  return { withTx: seen.size, total }
}

export type DashboardCheckItem = { id: string; text: string; href?: string }

export function buildDashboardCheckHints(params: {
  transactions: Transaction[]
  filterYear: number
  start: number
  end: number
  lowActivityThreshold?: number
}): DashboardCheckItem[] {
  const { transactions, filterYear, start, end, lowActivityThreshold = 5 } = params
  const out: DashboardCheckItem[] = []

  let expenseTxCount = 0
  let totalTxInPeriod = 0
  for (const t of transactions) {
    if (!transactionInMonthRange(t, filterYear, start, end)) continue
    totalTxInPeriod += 1
    if (t.type === 'expense') expenseTxCount += 1
  }

  if (expenseTxCount === 0 && totalTxInPeriod === 0) {
    const anyExpenseInYear = transactions.some(
      (t) =>
        t.type === 'expense' &&
        typeof t.date === 'string' &&
        t.date.startsWith(`${filterYear}-`),
    )
    if (!anyExpenseInYear) {
      out.push({
        id: 'no-expense-year',
        text: `Ingen utgifter registrert i ${filterYear} ennå.`,
        href: '/transaksjoner',
      })
    }
  }

  if (totalTxInPeriod > 0 && totalTxInPeriod < lowActivityThreshold) {
    out.push({
      id: 'low-activity',
      text: 'Lite aktivitet i valgt periode — stemmer tallene?',
      href: '/transaksjoner',
    })
  }

  return out.slice(0, 3)
}
