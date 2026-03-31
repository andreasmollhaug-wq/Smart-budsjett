import { describe, it, expect } from 'vitest'
import { simulatePayoffSchedule } from '@/lib/payoffSimulation'
import type { Debt } from '@/lib/store'

function mk(partial: Partial<Debt> & Pick<Debt, 'id' | 'name'>): Debt {
  return {
    totalAmount: 10000,
    remainingAmount: 5000,
    interestRate: 5,
    monthlyPayment: 500,
    type: 'loan',
    includeInSnowball: true,
    ...partial,
  }
}

describe('simulatePayoffSchedule', () => {
  it('records loanPayoffs in payoff order (snowball: minste restgjeld først)', () => {
    const debts: Debt[] = [
      mk({ id: 'a', name: 'Små', remainingAmount: 2000, monthlyPayment: 200, interestRate: 10 }),
      mk({ id: 'b', name: 'Stor', remainingAmount: 8000, monthlyPayment: 400, interestRate: 5 }),
    ]
    const r = simulatePayoffSchedule(debts, 'snowball', 0, 600)
    expect(r.loanPayoffs.length).toBe(2)
    expect(r.loanPayoffs[0]!.name).toBe('Små')
    expect(r.loanPayoffs[1]!.name).toBe('Stor')
    expect(r.loanPayoffs[0]!.monthIndex).toBeLessThanOrEqual(r.loanPayoffs[1]!.monthIndex)
  })

  it('includes totalRemainingInQueue on each monthly point', () => {
    const debts: Debt[] = [mk({ id: 'x', name: 'Ett', remainingAmount: 3000, monthlyPayment: 300, interestRate: 8 })]
    const r = simulatePayoffSchedule(debts, 'snowball', 0, 600)
    expect(r.monthly.length).toBeGreaterThan(0)
    for (const row of r.monthly) {
      expect(typeof row.totalRemainingInQueue).toBe('number')
      expect(row.totalRemainingInQueue).toBeGreaterThanOrEqual(0)
    }
    const last = r.monthly[r.monthly.length - 1]!
    expect(last.totalRemainingInQueue).toBeLessThanOrEqual(0.5)
  })

  it('returns empty loanPayoffs when no queue loans', () => {
    const r = simulatePayoffSchedule([], 'snowball', 0)
    expect(r.loanPayoffs).toEqual([])
    expect(r.monthly).toEqual([])
  })
})
