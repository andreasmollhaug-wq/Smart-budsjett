import { describe, expect, it } from 'vitest'
import { buildSavingsRateTrendForPeriod, computeSavingsRatePercent } from './dashboardOverviewHelpers'
import type { Transaction } from './store'

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
