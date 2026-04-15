import { describe, expect, it } from 'vitest'
import type { BudgetCategory } from '@/lib/store'
import { createEmptyBatchRow, validateAndBuildSameDayTransactions } from './transactionBatch'

function cat(
  overrides: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>,
): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#ccc',
    frequency: 'monthly',
    ...overrides,
  } as BudgetCategory
}

describe('validateAndBuildSameDayTransactions', () => {
  const options: BudgetCategory[] = [
    cat({
      id: '1',
      name: 'Mat',
      parentCategory: 'utgifter',
      type: 'expense',
    }),
  ]

  it('returnerer feil når alle rader er tomme', () => {
    const rows = [createEmptyBatchRow(), createEmptyBatchRow()]
    const r = validateAndBuildSameDayTransactions(rows, {
      date: '2026-04-15',
      categoryOptions: options,
      todayStr: '2026-04-01',
      profilePatch: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/minst én/)
  })

  it('bygger transaksjoner for gyldige rader og hopper over tomme', () => {
    const a = createEmptyBatchRow()
    const b = createEmptyBatchRow()
    const rows = [
      { ...a, description: 'A', amount: '100', category: 'Mat' },
      { ...b, description: '', amount: '', category: '' },
    ]
    const r = validateAndBuildSameDayTransactions(rows, {
      date: '2026-04-15',
      categoryOptions: options,
      todayStr: '2026-04-01',
      profilePatch: {},
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.transactions).toHaveLength(1)
      expect(r.transactions[0]!.description).toBe('A')
      expect(r.transactions[0]!.amount).toBe(100)
      expect(r.transactions[0]!.date).toBe('2026-04-15')
      expect(r.transactions[0]!.type).toBe('expense')
    }
  })

  it('feiler ved delvis utfylt rad', () => {
    const row = createEmptyBatchRow()
    const rows = [{ ...row, description: 'X', amount: '', category: '' }]
    const r = validateAndBuildSameDayTransactions(rows, {
      date: '2026-04-15',
      categoryOptions: options,
      todayStr: '2026-04-01',
      profilePatch: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/Rad 1/)
  })

  it('bruker formParent ved kategori-oppslag', () => {
    const multi: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Mat',
        parentCategory: 'utgifter',
        type: 'expense',
      }),
      cat({
        id: '2',
        name: 'Boliglån',
        parentCategory: 'gjeld',
        type: 'expense',
      }),
    ]
    const row = createEmptyBatchRow()
    const rows = [
      {
        ...row,
        formParent: 'gjeld' as const,
        description: 'Avdrag',
        amount: '5000',
        category: 'Boliglån',
      },
    ]
    const r = validateAndBuildSameDayTransactions(rows, {
      date: '2026-04-15',
      categoryOptions: multi,
      todayStr: '2026-04-01',
      profilePatch: {},
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.transactions[0]!.category).toBe('Boliglån')
  })

  it('feiler når kategori ikke finnes i valgt hovedgruppe', () => {
    const multi: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Mat',
        parentCategory: 'utgifter',
        type: 'expense',
      }),
      cat({
        id: '2',
        name: 'Boliglån',
        parentCategory: 'gjeld',
        type: 'expense',
      }),
    ]
    const row = createEmptyBatchRow()
    const rows = [
      {
        ...row,
        formParent: 'gjeld' as const,
        description: 'X',
        amount: '100',
        category: 'Mat',
      },
    ]
    const r = validateAndBuildSameDayTransactions(rows, {
      date: '2026-04-15',
      categoryOptions: multi,
      todayStr: '2026-04-01',
      profilePatch: {},
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/hovedgruppe/)
  })
})
