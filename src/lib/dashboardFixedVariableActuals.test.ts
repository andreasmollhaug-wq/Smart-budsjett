import { describe, expect, it } from 'vitest'
import { summarizeFixedVariableExpenseActuals } from './dashboardFixedVariableActuals'
import type { BudgetCategory, Transaction } from './store'

function cat(o: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...o,
  } as BudgetCategory
}

describe('summarizeFixedVariableExpenseActuals', () => {
  it('klassifiserer månedlig kategori som fest', () => {
    const categories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Husleie',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'monthly',
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-03-01',
        description: 'x',
        amount: 10000,
        category: 'Husleie',
        type: 'expense',
      },
    ]
    const r = summarizeFixedVariableExpenseActuals(transactions, 2026, 0, 11, categories)
    expect(r.fixed).toBe(10000)
    expect(r.variable).toBe(0)
  })

  it('klassifiserer engangskategori som variabelt', () => {
    const categories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        frequency: 'once',
        onceMonthIndex: 2,
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-03-10',
        description: 'x',
        amount: 500,
        category: 'Mat',
        type: 'expense',
      },
    ]
    const r = summarizeFixedVariableExpenseActuals(transactions, 2026, 0, 11, categories)
    expect(r.fixed).toBe(0)
    expect(r.variable).toBe(500)
  })

  it('koblet tjenesteabonnement teller som fest uten månedlig kategori', () => {
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-01-05',
        description: 'x',
        amount: 99,
        category: 'Diverse',
        type: 'expense',
        linkedServiceSubscriptionId: 'sub-1',
      },
    ]
    const r = summarizeFixedVariableExpenseActuals(transactions, 2026, 0, 11, [])
    expect(r.fixed).toBe(99)
    expect(r.variable).toBe(0)
  })

  it('respekterer månedfilter', () => {
    const categories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'X',
        type: 'expense',
        parentCategory: 'utgifter',
        frequency: 'monthly',
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-01-05',
        amount: 100,
        category: 'X',
        type: 'expense',
        description: '',
      },
      {
        id: 'b',
        date: '2026-06-05',
        amount: 200,
        category: 'X',
        type: 'expense',
        description: '',
      },
    ]
    const r = summarizeFixedVariableExpenseActuals(transactions, 2026, 0, 0, categories)
    expect(r.totalExpense).toBe(100)
  })
})
