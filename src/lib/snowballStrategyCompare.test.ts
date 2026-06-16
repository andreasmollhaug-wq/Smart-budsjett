import { describe, expect, it } from 'vitest'
import { simulatePayoffSchedule } from '@/lib/payoffSimulation'
import type { Debt } from '@/lib/store'
import {
  buildDemoStrategyCompareBundle,
  buildStrategyCompareBundle,
  buildStrategyCompareSummary,
  cheaperStrategyLabel,
} from '@/lib/snowballStrategyCompare'

const baseDebts: Debt[] = [
  {
    id: 'd1',
    name: 'Liten',
    totalAmount: 20_000,
    remainingAmount: 15_000,
    monthlyPayment: 500,
    interestRate: 12,
    type: 'consumer_loan',
    includeInSnowball: true,
  },
  {
    id: 'd2',
    name: 'Stor',
    totalAmount: 100_000,
    remainingAmount: 80_000,
    monthlyPayment: 1_200,
    interestRate: 6,
    type: 'loan',
    includeInSnowball: true,
  },
]

describe('snowballStrategyCompare', () => {
  it('demo viser tydelig forskjell mellom metoder', () => {
    const bundle = buildDemoStrategyCompareBundle()
    expect(bundle.summary.interestDifference).toBeGreaterThan(500)
    expect(cheaperStrategyLabel(bundle.summary)).toBe('avalanche')
  })

  it('bygger bundle når kø finnes', () => {
    const bundle = buildStrategyCompareBundle(baseDebts, 500)
    expect(bundle).not.toBeNull()
    expect(bundle!.chartPoints.length).toBeGreaterThan(0)
  })

  it('returnerer null uten kø', () => {
    expect(buildStrategyCompareBundle([], 0)).toBeNull()
  })

  it('skiller metoder når rentene er ulike', () => {
    const snowball = simulatePayoffSchedule(baseDebts, 'snowball', 500)
    const avalanche = simulatePayoffSchedule(baseDebts, 'avalanche', 500)
    const summary = buildStrategyCompareSummary(snowball, avalanche)
    expect(summary.avalancheTotalInterest).toBeLessThanOrEqual(summary.snowballTotalInterest)
    expect(['avalanche', 'tie']).toContain(cheaperStrategyLabel(summary))
  })
})
