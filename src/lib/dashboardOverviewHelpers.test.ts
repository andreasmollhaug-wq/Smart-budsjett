import { describe, expect, it } from 'vitest'
import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { summarizeBudgetVsRows } from '@/lib/dashboardOverviewHelpers'

describe('summarizeBudgetVsRows', () => {
  it('summerer inntekt, utgift og netto', () => {
    const rows: BudgetVsActualRow[] = [
      {
        categoryId: '1',
        name: 'Lønn',
        parentCategory: 'inntekter',
        type: 'income',
        budgeted: 40_000,
        actual: 42_000,
        variance: 2000,
      },
      {
        categoryId: '2',
        name: 'Mat',
        parentCategory: 'utgifter',
        type: 'expense',
        budgeted: 8000,
        actual: 9000,
        variance: 1000,
      },
    ]
    const s = summarizeBudgetVsRows(rows)
    expect(s.budgetedIncome).toBe(40_000)
    expect(s.actualIncome).toBe(42_000)
    expect(s.budgetedExpense).toBe(8000)
    expect(s.actualExpense).toBe(9000)
    expect(s.actualNet).toBe(42_000 - 9000)
    expect(s.budgetNet).toBe(40_000 - 8000)
    expect(s.worstExpenseOvers).toHaveLength(1)
    expect(s.worstExpenseOvers[0]?.name).toBe('Mat')
  })
})
