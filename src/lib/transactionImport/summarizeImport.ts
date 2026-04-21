import type { Transaction } from '@/lib/store'
import { effectiveIncomeTransactionAmount, type IncomeWithholdingRule } from '@/lib/incomeWithholding'

export type CategorySummaryRow = {
  category: string
  count: number
  sum: number
}

export type ImportSummary = {
  importedCount: number
  totalAmount: number
  incomeTotal: number
  expenseTotal: number
  dateMin: string | null
  dateMax: string | null
  byCategory: CategorySummaryRow[]
}

export function summarizeImportedTransactions(
  transactions: Transaction[],
  profileIncomeWithholding?: IncomeWithholdingRule | null,
): ImportSummary {
  let incomeTotal = 0
  let expenseTotal = 0
  let dateMin: string | null = null
  let dateMax: string | null = null
  const byCat = new Map<string, { count: number; sum: number }>()

  for (const t of transactions) {
    const incAmt =
      t.type === 'income' ? effectiveIncomeTransactionAmount(t, profileIncomeWithholding ?? undefined) : t.amount
    if (t.type === 'income') incomeTotal += incAmt
    else expenseTotal += t.amount

    if (!dateMin || t.date < dateMin) dateMin = t.date
    if (!dateMax || t.date > dateMax) dateMax = t.date

    const cur = byCat.get(t.category) ?? { count: 0, sum: 0 }
    cur.count += 1
    cur.sum += incAmt
    byCat.set(t.category, cur)
  }

  const byCategory: CategorySummaryRow[] = [...byCat.entries()]
    .map(([category, v]) => ({ category, count: v.count, sum: v.sum }))
    .sort((a, b) => b.sum - a.sum || a.category.localeCompare(b.category, 'nb'))

  const totalAmount = transactions.reduce(
    (s, t) =>
      s +
      (t.type === 'income'
        ? effectiveIncomeTransactionAmount(t, profileIncomeWithholding ?? undefined)
        : t.amount),
    0,
  )

  return {
    importedCount: transactions.length,
    totalAmount,
    incomeTotal,
    expenseTotal,
    dateMin,
    dateMax,
    byCategory,
  }
}
