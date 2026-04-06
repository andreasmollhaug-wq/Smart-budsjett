import { describe, expect, it } from 'vitest'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import { mergeBudgetCategoriesForTransactionPicker } from './transactionCategoryPicker'

describe('mergeBudgetCategoriesForTransactionPicker', () => {
  it('legger inn standardkategorier når budsjett er tomt', () => {
    const merged = mergeBudgetCategoriesForTransactionPicker([], emptyLabelLists())
    expect(merged.length).toBeGreaterThan(20)
    expect(merged.some((c) => c.name === 'Lønn' && c.type === 'income')).toBe(true)
    expect(merged.some((c) => c.name === 'Mat & dagligvarer' && c.type === 'expense')).toBe(true)
  })

  it('bevarer eksisterende budsjettlinje og legger til manglende fra katalog', () => {
    const merged = mergeBudgetCategoriesForTransactionPicker(
      [
        {
          id: 'x',
          name: 'Lønn',
          budgeted: Array(12).fill(10_000),
          spent: 0,
          type: 'income',
          color: '#0CA678',
          parentCategory: 'inntekter',
          frequency: 'monthly',
        },
      ],
      emptyLabelLists(),
    )
    const lønn = merged.filter((c) => c.name === 'Lønn')
    expect(lønn).toHaveLength(1)
    expect(lønn[0]!.id).toBe('x')
  })
})
