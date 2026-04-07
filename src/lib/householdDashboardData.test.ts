import { describe, expect, it } from 'vitest'
import { buildHouseholdPeriodData, getBudgetCategoriesForProfileYear } from './householdDashboardData'
import type { BudgetCategory, PersonData, Transaction } from './store'

function cat(overrides: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...overrides,
  } as BudgetCategory
}

describe('getBudgetCategoriesForProfileYear', () => {
  it('bruker people når år er aktivt budsjettår', () => {
    const people: Record<string, PersonData> = {
      a: {
        transactions: [],
        budgetCategories: [cat({ id: '1', name: 'Lønn', parentCategory: 'inntekter', type: 'income' })],
        customBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
        hiddenBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
        savingsGoals: [],
        debts: [],
        investments: [],
      },
    }
    const got = getBudgetCategoriesForProfileYear(people, {}, 'a', 2026, 2026)
    expect(got).toHaveLength(1)
    expect(got[0]!.name).toBe('Lønn')
  })

  it('bruker arkiv når år ikke er aktivt', () => {
    const people: Record<string, PersonData> = {
      a: {
        transactions: [],
        budgetCategories: [],
        customBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
        hiddenBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
        savingsGoals: [],
        debts: [],
        investments: [],
      },
    }
    const archived = {
      '2024': {
        a: [cat({ id: 'x', name: 'Gammel', parentCategory: 'inntekter', type: 'income' })],
      },
    }
    const got = getBudgetCategoriesForProfileYear(people, archived, 'a', 2024, 2026)
    expect(got[0]!.name).toBe('Gammel')
  })
})

describe('buildHouseholdPeriodData', () => {
  const p1 = 'p1'
  const p2 = 'p2'

  const people: Record<string, PersonData> = {
    [p1]: {
      transactions: [],
      budgetCategories: [
        cat({
          id: 'i1',
          name: 'Lønn',
          type: 'income',
          parentCategory: 'inntekter',
          budgeted: [10000, 10000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
        cat({
          id: 'e1',
          name: 'Mat',
          type: 'expense',
          parentCategory: 'utgifter',
          budgeted: [2000, 2000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
        cat({
          id: 's1',
          name: 'Buffer',
          type: 'expense',
          parentCategory: 'sparing',
          budgeted: [1000, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
      ],
      customBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
      hiddenBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
      savingsGoals: [],
      debts: [],
      investments: [],
    },
    [p2]: {
      transactions: [],
      budgetCategories: [
        cat({
          id: 'i2',
          name: 'Lønn',
          type: 'income',
          parentCategory: 'inntekter',
          budgeted: [5000, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
        cat({
          id: 'e2',
          name: 'Strøm',
          type: 'expense',
          parentCategory: 'regninger',
          budgeted: [500, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
      ],
      customBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
      hiddenBudgetLabels: { inntekter: [], regninger: [], utgifter: [], gjeld: [], sparing: [] },
      savingsGoals: [],
      debts: [],
      investments: [],
    },
  }

  const profiles = [
    { id: p1, name: 'A' },
    { id: p2, name: 'B' },
  ]

  const txs: Transaction[] = [
    {
      id: 't1',
      date: '2026-01-15',
      description: 'lønn',
      amount: 9000,
      category: 'Lønn',
      type: 'income',
      profileId: p1,
    },
    {
      id: 't2',
      date: '2026-01-10',
      description: 'mat',
      amount: 1800,
      category: 'Mat',
      type: 'expense',
      profileId: p1,
    },
  ]

  it('fordeler budsjettert inntekt og utgifter per person for januar', () => {
    const { members, summary, hasNoBudgetData } = buildHouseholdPeriodData(
      people,
      {},
      profiles,
      2026,
      2026,
      0,
      0,
      txs,
    )

    expect(hasNoBudgetData).toBe(false)
    expect(summary.householdBudgetedIncome).toBe(15000)
    expect(summary.householdBudgetedSparing).toBe(1000)
    expect(members).toHaveLength(2)

    const a = members.find((m) => m.profileId === p1)!
    const b = members.find((m) => m.profileId === p2)!
    expect(a.budgetedIncome).toBe(10000)
    expect(b.budgetedIncome).toBe(5000)
    expect(a.incomeShareOfHousehold).toBeCloseTo(10000 / 15000, 5)
    expect(a.budgetedExpenseByGroup.utgifter).toBe(2000)
    expect(a.budgetedExpenseByGroup.sparing).toBe(1000)
    expect(b.budgetedExpenseByGroup.regninger).toBe(500)

    expect(a.actualIncome).toBe(9000)
    expect(a.actualExpense).toBe(1800)
    expect(b.actualIncome).toBe(0)
    expect(b.actualExpense).toBe(0)
  })

  it('householdBudgetedNet er inntekt minus alle kostgrupper', () => {
    const { summary } = buildHouseholdPeriodData(people, {}, profiles, 2026, 2026, 0, 0, [])
    // jan: 15000 inntekt, utgifter 2000+500+1000 sparing = 3500
    expect(summary.householdBudgetedNet).toBe(15000 - 3500)
  })
})
