import { describe, expect, it } from 'vitest'
import {
  buildArsvisningDataInsights,
  buildSavingsRateTrendForPeriod,
  computeSavingsRatePercent,
} from './dashboardOverviewHelpers'
import type { BudgetCategory, Transaction } from './store'

describe('computeSavingsRatePercent', () => {
  it('returnerer prosent når inntekt > 0', () => {
    expect(computeSavingsRatePercent(100_000, 80_000)).toBeCloseTo(20, 5)
  })

  it('returnerer null når inntekt er 0', () => {
    expect(computeSavingsRatePercent(0, 100)).toBeNull()
  })

  it('returnerer null når inntekt er negativ', () => {
    expect(computeSavingsRatePercent(-1, 0)).toBeNull()
  })
})

describe('buildSavingsRateTrendForPeriod', () => {
  it('gir én rad per måned i området', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-02-01',
        amount: 50_000,
        category: 'Lønn',
        type: 'income',
        description: '',
      },
      {
        id: '2',
        date: '2026-02-15',
        amount: 40_000,
        category: 'Div',
        type: 'expense',
        description: '',
      },
    ]
    const t = buildSavingsRateTrendForPeriod(transactions, 2026, 1, 1)
    expect(t).toHaveLength(1)
    expect(t[0]!.monthIndex).toBe(1)
    expect(t[0]!.ratePct).toBeCloseTo(20, 5)
  })
})

describe('buildArsvisningDataInsights', () => {
  it('flagger transaksjoner uten matchende budsjettlinje', () => {
    const displayCategories: BudgetCategory[] = [
      {
        id: '1',
        name: 'Lønn',
        budgeted: Array(12).fill(0),
        spent: 0,
        type: 'income',
        color: '#000',
        parentCategory: 'inntekter',
        frequency: 'monthly',
      },
    ]
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-03-01',
        amount: 500,
        category: 'Ukjent kategori',
        type: 'expense',
        description: '',
      },
    ]
    const actualYearMatrix = new Map<string, number[]>([['Lønn', Array(12).fill(0)]])
    const out = buildArsvisningDataInsights({
      transactions,
      year: 2026,
      displayCategories,
      actualYearMatrix,
    })
    expect(out.some((x) => x.id.startsWith('orphan'))).toBe(true)
  })

  it('flagger budsjettert linje uten transaksjoner i året', () => {
    const displayCategories: BudgetCategory[] = [
      {
        id: 'x',
        name: 'Mat',
        budgeted: Array(12).fill(1000),
        spent: 0,
        type: 'expense',
        color: '#000',
        parentCategory: 'utgifter',
        frequency: 'monthly',
      },
    ]
    const transactions: Transaction[] = []
    const actualYearMatrix = new Map<string, number[]>([['Mat', Array(12).fill(0)]])
    const out = buildArsvisningDataInsights({
      transactions,
      year: 2026,
      displayCategories,
      actualYearMatrix,
    })
    expect(out.some((x) => x.id.startsWith('nobudgetact'))).toBe(true)
  })
})
