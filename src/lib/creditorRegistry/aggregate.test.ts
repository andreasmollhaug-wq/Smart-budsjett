import { describe, expect, it } from 'vitest'
import { computeGroupTotals, computeRegistryOverview } from './aggregate'
import type { CreditorRegistryGroup } from './types'

describe('computeGroupTotals', () => {
  it('summerer tom gruppe', () => {
    const g: CreditorRegistryGroup = { id: '1', name: 'SVEA', loans: [] }
    expect(computeGroupTotals(g)).toEqual({
      loanCount: 0,
      totalRemaining: 0,
      totalMonthly: 0,
      totalAnnualInterest: 0,
      highestInterestRate: 0,
    })
  })

  it('summerer flere lån', () => {
    const g: CreditorRegistryGroup = {
      id: '1',
      name: 'SVEA',
      loans: [
        {
          id: 'a',
          name: 'Lån 1',
          remainingAmount: 100_000,
          monthlyPayment: 2_000,
          interestRate: 10,
          type: 'loan',
        },
        {
          id: 'b',
          name: 'Lån 2',
          remainingAmount: 50_000,
          monthlyPayment: 1_000,
          interestRate: 15,
          type: 'consumer_loan',
        },
      ],
    }
    const t = computeGroupTotals(g)
    expect(t.loanCount).toBe(2)
    expect(t.totalRemaining).toBe(150_000)
    expect(t.totalMonthly).toBe(3_000)
    expect(t.totalAnnualInterest).toBe(10_000 + 7_500)
    expect(t.highestInterestRate).toBe(15)
  })
})

describe('computeRegistryOverview', () => {
  it('agregerer på tvers av kreditorer', () => {
    const creditors: CreditorRegistryGroup[] = [
      { id: '1', name: 'A', loans: [{ id: 'l1', name: 'X', remainingAmount: 10_000, monthlyPayment: 500, interestRate: 5, type: 'loan' }] },
      { id: '2', name: 'B', loans: [] },
    ]
    const o = computeRegistryOverview(creditors)
    expect(o.creditorCount).toBe(2)
    expect(o.loanCount).toBe(1)
    expect(o.totalRemaining).toBe(10_000)
    expect(o.totalMonthly).toBe(500)
  })
})
