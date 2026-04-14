import { describe, expect, it } from 'vitest'
import { mergeBudgetCategoryValues } from './budgetCategoryMerge'
import type { BudgetCategory } from './store'

function baseCat(over: Partial<BudgetCategory>): BudgetCategory {
  return {
    id: 'x',
    name: 'Test',
    budgeted: Array(12).fill(0),
    spent: 100,
    type: 'expense',
    color: '#000',
    parentCategory: 'regninger',
    frequency: 'monthly',
    ...over,
  }
}

describe('mergeBudgetCategoryValues', () => {
  it('merger to once med én positiv måned etter to engangsposter samme måned', () => {
    const existing = baseCat({
      frequency: 'once',
      onceMonthIndex: 5,
      budgeted: [...Array(12).fill(0).map((_, i) => (i === 5 ? 3000 : 0))],
      spent: 50,
    })
    const incoming = [...Array(12).fill(0).map((_, i) => (i === 5 ? 2000 : 0))]
    const r = mergeBudgetCategoryValues(existing, incoming, 0)
    expect(r.budgeted![5]).toBe(5000)
    expect(r.frequency).toBe('once')
    expect(r.onceMonthIndex).toBe(5)
    expect(r.spent).toBe(50)
  })

  it('setter monthly og fjerner onceMonthIndex når flere måneder har beløp', () => {
    const existing = baseCat({
      frequency: 'once',
      onceMonthIndex: 2,
      budgeted: [...Array(12).fill(0).map((_, i) => (i === 2 ? 2000 : 0))],
      spent: 0,
    })
    const incoming = [...Array(12).fill(0).map((_, i) => (i === 7 ? 3000 : 0))]
    const r = mergeBudgetCategoryValues(existing, incoming, 0)
    expect(r.budgeted![2]).toBe(2000)
    expect(r.budgeted![7]).toBe(3000)
    expect(r.frequency).toBe('monthly')
    expect(r.onceMonthIndex).toBeUndefined()
  })
})
