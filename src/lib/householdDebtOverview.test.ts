import { describe, expect, it } from 'vitest'
import { buildHouseholdDebtOverview, effectiveDebtMonthlyPayment } from './householdDebtOverview'
import type { Debt, PersonData, PersonProfile } from './store'

function emptyPerson(): PersonData {
  return {
    transactions: [],
    budgetCategories: [],
    customBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
    hiddenBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
    savingsGoals: [],
    debts: [],
    investments: [],
    serviceSubscriptions: [],
  }
}

function debt(overrides: Partial<Debt> & Pick<Debt, 'id' | 'name' | 'type'>): Debt {
  return {
    totalAmount: 100_000,
    remainingAmount: 50_000,
    interestRate: 5,
    monthlyPayment: 2000,
    ...overrides,
  }
}

describe('effectiveDebtMonthlyPayment', () => {
  it('returnerer 0 ved aktiv avdragspause', () => {
    const d = debt({
      id: '1',
      name: 'Test',
      type: 'loan',
      repaymentPaused: true,
      monthlyPayment: 3000,
    })
    expect(effectiveDebtMonthlyPayment(d)).toBe(0)
  })

  it('returnerer avtalt avdrag når ikke pause', () => {
    const d = debt({ id: '1', name: 'Test', type: 'loan', monthlyPayment: 1500 })
    expect(effectiveDebtMonthlyPayment(d)).toBe(1500)
  })
})

describe('buildHouseholdDebtOverview', () => {
  const p1 = 'a'
  const p2 = 'b'
  const profiles: PersonProfile[] = [
    { id: p1, name: 'Per' },
    { id: p2, name: 'Kari' },
  ]

  it('summerer to profiler med gjeld', () => {
    const people: Record<string, PersonData> = {
      [p1]: {
        ...emptyPerson(),
        debts: [
          debt({ id: 'd1', name: 'Lån 1', type: 'loan', remainingAmount: 100_000, monthlyPayment: 1000, interestRate: 4 }),
        ],
      },
      [p2]: {
        ...emptyPerson(),
        debts: [
          debt({
            id: 'd2',
            name: 'Kort',
            type: 'credit_card',
            remainingAmount: 20_000,
            monthlyPayment: 500,
            interestRate: 18,
          }),
        ],
      },
    }

    const r = buildHouseholdDebtOverview(people, profiles)
    expect(r.household.totalRemaining).toBe(120_000)
    expect(r.household.totalMonthlyEffective).toBe(1500)
    expect(r.household.debtCount).toBe(2)
    expect(r.members).toHaveLength(2)
    expect(r.members[0]!.totalRemaining).toBe(100_000)
    expect(r.members[1]!.totalRemaining).toBe(20_000)
    expect(r.members[1]!.highestInterestRate).toBe(18)
  })

  it('håndterer tom gjeld for begge', () => {
    const people: Record<string, PersonData> = {
      [p1]: emptyPerson(),
      [p2]: emptyPerson(),
    }
    const r = buildHouseholdDebtOverview(people, profiles)
    expect(r.household.totalRemaining).toBe(0)
    expect(r.household.debtCount).toBe(0)
    expect(r.members.every((m) => m.debtCount === 0)).toBe(true)
  })

  it('fordeler restgjeld på type', () => {
    const people: Record<string, PersonData> = {
      [p1]: {
        ...emptyPerson(),
        debts: [
          debt({ id: 'm1', name: 'Bolig', type: 'mortgage', remainingAmount: 2_000_000, monthlyPayment: 8000, interestRate: 4 }),
        ],
      },
      [p2]: emptyPerson(),
    }
    const r = buildHouseholdDebtOverview(people, [{ id: p1, name: 'Per' }])
    expect(r.members[0]!.remainingByType.mortgage).toBe(2_000_000)
    expect(r.household.remainingByType.mortgage).toBe(2_000_000)
    expect(r.household.remainingByType.credit_card).toBe(0)
  })
})
