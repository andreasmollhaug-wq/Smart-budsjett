import { describe, expect, it } from 'vitest'
import type { BudgetCategory } from '@/lib/store'
import { buildBudgetPlanExportPayload } from './buildBudgetPlanExportPayload'

function expense(id: string, name: string, budgeted: number[]): BudgetCategory {
  return {
    id,
    name,
    budgeted,
    spent: 0,
    type: 'expense',
    color: '#3B5BDB',
    parentCategory: 'regninger',
    frequency: 'monthly',
  }
}

describe('buildBudgetPlanExportPayload', () => {
  it('summerer KPI for fullYear', () => {
    const categories: BudgetCategory[] = [
      {
        id: 'i1',
        name: 'Lønn',
        budgeted: Array(12).fill(50_000),
        spent: 0,
        type: 'income',
        color: '#0CA678',
        parentCategory: 'inntekter',
        frequency: 'monthly',
      },
      expense('e1', 'Husleie', Array(12).fill(12_000)),
    ]
    const payload = buildBudgetPlanExportPayload(categories, {
      layout: 'fullYear',
      monthIndex: 0,
      onlyLinesWithAmounts: false,
      scopeLabel: 'Test',
    })
    expect(payload.kpis.budgetedIncome).toBe(600_000)
    expect(payload.kpis.budgetedExpense).toBe(144_000)
    expect(payload.kpis.budgetResult).toBe(456_000)
    expect(payload.rows).toHaveLength(2)
  })

  it('filtrerer onlyLinesWithAmounts for singleMonth', () => {
    const categories = [
      expense('e1', 'Med beløp', Array.from({ length: 12 }, (_, i) => (i === 3 ? 100 : 0))),
      expense('e2', 'Uten', Array(12).fill(0)),
    ]
    const payload = buildBudgetPlanExportPayload(categories, {
      layout: 'singleMonth',
      monthIndex: 3,
      onlyLinesWithAmounts: true,
      scopeLabel: 'Test',
    })
    expect(payload.rows).toHaveLength(1)
    expect(payload.rows[0].name).toBe('Med beløp')
  })
})
