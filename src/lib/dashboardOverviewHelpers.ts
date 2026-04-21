import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { MONTH_LABELS_SHORT_NB } from '@/lib/bankReportData'
import { effectiveIncomeTransactionAmount } from '@/lib/incomeWithholding'
import type { BudgetCategory, PersonData, Transaction } from '@/lib/store'

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
  people?: Record<string, PersonData>,
): SavingsRateMonthPoint[] {
  const out: SavingsRateMonthPoint[] = []
  for (let m = monthStartInclusive; m <= monthEndInclusive; m++) {
    const { income, expense } = sumIncomeExpenseInMonthRange(transactions, year, m, m, people)
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
  people?: Record<string, PersonData>,
): { income: number; expense: number } {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (!transactionInMonthRange(t, year, monthStartInclusive, monthEndInclusive)) continue
    if (t.type === 'income') {
      const pid = t.profileId ?? ''
      income += effectiveIncomeTransactionAmount(t, people?.[pid]?.defaultIncomeWithholding)
    } else expense += t.amount
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

export type ArsvisningInsightItem = { id: string; text: string; href?: string }

const MAX_ARSVISNING_INSIGHTS = 8

/** Hint for årssiden: transaksjoner uten matchende budsjettlinje, og budsjett uten aktivitet i året. */
export function buildArsvisningDataInsights(params: {
  transactions: Transaction[]
  year: number
  displayCategories: BudgetCategory[]
  actualYearMatrix: Map<string, number[]>
}): ArsvisningInsightItem[] {
  const { transactions, year, displayCategories, actualYearMatrix } = params
  const budgetKeys = new Set(displayCategories.map((c) => `${c.name}::${c.type}`))

  const orphanTotals = new Map<string, { name: string; type: 'income' | 'expense'; total: number }>()
  for (const t of transactions) {
    if (!t.date || t.date.length < 7 || !t.date.startsWith(`${year}-`)) continue
    const mm = Number.parseInt(t.date.slice(5, 7), 10)
    if (!Number.isFinite(mm) || mm < 1 || mm > 12) continue
    const key = `${t.category}::${t.type}`
    if (budgetKeys.has(key)) continue
    const amt = Number.isFinite(t.amount) ? t.amount : 0
    if (amt === 0) continue
    const cur = orphanTotals.get(key)
    if (cur) cur.total += amt
    else orphanTotals.set(key, { name: t.category, type: t.type, total: amt })
  }

  const orphanRows = [...orphanTotals.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  const orphans: ArsvisningInsightItem[] = orphanRows.map((v) => {
    const label = v.type === 'income' ? 'inntekt' : 'utgift'
    return {
      id: `orphan-${v.name}-${v.type}`,
      text: `«${v.name}» (${label}) har transaksjoner i ${year}, men ingen tilsvarende budsjettlinje.`,
      href: `/transaksjoner?year=${year}&month=all&category=${encodeURIComponent(v.name)}`,
    }
  })

  const noActivity: ArsvisningInsightItem[] = []
  for (const c of displayCategories) {
    const arr = c.budgeted
    let budgetSum = 0
    if (Array.isArray(arr) && arr.length === 12) {
      for (let i = 0; i < 12; i++) budgetSum += arr[i] ?? 0
    }
    if (budgetSum <= 0) continue
    const row = actualYearMatrix.get(c.name)
    let actualSum = 0
    if (row) for (let i = 0; i < 12; i++) actualSum += row[i] ?? 0
    if (actualSum !== 0) continue
    noActivity.push({
      id: `nobudgetact-${c.id}`,
      text: `«${c.name}» er budsjettert i ${year}, men det er ikke registrert transaksjoner på linjen.`,
      href: `/transaksjoner?year=${year}&month=all&category=${encodeURIComponent(c.name)}`,
    })
  }

  const combined = [...orphans, ...noActivity]
  return combined.slice(0, MAX_ARSVISNING_INSIGHTS)
}
