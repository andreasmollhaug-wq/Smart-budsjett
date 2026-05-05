import { describe, expect, it } from 'vitest'
import { emptyLabelLists } from './budgetCategoryCatalog'
import { mergeBudgetCategoriesWithTransactionsInYear } from './mergeBudgetCategoriesWithTransactionsInYear'
import type { BudgetCategory, Transaction } from './store'

function budgetLine(
  overrides: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>,
): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...overrides,
  } as BudgetCategory
}

describe('mergeBudgetCategoriesWithTransactionsInYear', () => {
  const lists = emptyLabelLists()

  it('tom basis og transaksjon i året gir én syntetisk linje (standard utgift)', () => {
    const tx: Transaction = {
      id: '1',
      date: '2026-03-10',
      description: 'Rema',
      amount: 120,
      category: 'Mat & dagligvarer',
      type: 'expense',
    }
    const r = mergeBudgetCategoriesWithTransactionsInYear([], [tx], 2026, lists)
    expect(r).toHaveLength(1)
    expect(r[0]!.name).toBe('Mat & dagligvarer')
    expect(r[0]!.parentCategory).toBe('utgifter')
    expect(r[0]!.type).toBe('expense')
  })

  it('tom basis og transaksjon inntekt «Lønn» gir synthetic under inntekter', () => {
    const tx: Transaction = {
      id: '1',
      date: '2026-01-15',
      description: 'Lønn',
      amount: 40000,
      category: 'Lønn',
      type: 'income',
    }
    const r = mergeBudgetCategoriesWithTransactionsInYear([], [tx], 2026, lists)
    expect(r).toHaveLength(1)
    expect(r[0]!.parentCategory).toBe('inntekter')
    expect(r[0]!.type).toBe('income')
  })

  it('basis med eksisterende linje: ingen dublett ved samme (navn, type)', () => {
    const base = [
      budgetLine({
        id: 'b-mat',
        name: 'Mat & dagligvarer',
        parentCategory: 'utgifter',
        type: 'expense',
      }),
    ]
    const tx: Transaction = {
      id: 't1',
      date: '2026-03-01',
      description: 'x',
      amount: 50,
      category: 'Mat & dagligvarer',
      type: 'expense',
    }
    const r = mergeBudgetCategoriesWithTransactionsInYear(base, [tx], 2026, lists)
    expect(r).toHaveLength(1)
    expect(r[0]!.id).toBe('b-mat')
  })

  it('ukjent utgiftsnavn havner på utgifter-gruppen som fallback', () => {
    const tx: Transaction = {
      id: '1',
      date: '2026-06-06',
      description: '?',
      amount: 10,
      category: 'TotallyUnknownVendorBucket',
      type: 'expense',
    }
    const r = mergeBudgetCategoriesWithTransactionsInYear([], [tx], 2026, lists)
    expect(r).toHaveLength(1)
    expect(r[0]!.parentCategory).toBe('utgifter')
    expect(r[0]!.type).toBe('expense')
  })

  it('filtrerer på kalenderår', () => {
    const txPrev: Transaction = {
      id: 'a',
      date: '2025-06-06',
      description: 'Old',
      amount: 10,
      category: 'Gamle greier',
      type: 'expense',
    }
    const r = mergeBudgetCategoriesWithTransactionsInYear([], [txPrev], 2026, lists)
    expect(r).toHaveLength(0)
  })
})
