import { describe, expect, it } from 'vitest'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import type { Debt } from '@/lib/store'
import {
  appendDebtPlannedTransactionsForBudgetYear,
  budgetedFromMonthlyFromMonth,
  buildPlannedDebtTransactions,
  clampSyncBudgetFromMonth1,
  effectiveDebtMonthlyPayment,
  normalizeDebtLinkedBudgetCategoriesToFullYear,
  uniqueGjeldName,
} from '@/lib/debtBudgetSync'

function baseDebt(over: Partial<Debt> = {}): Debt {
  return {
    id: 'd1',
    name: 'Testlån',
    totalAmount: 100_000,
    remainingAmount: 50_000,
    interestRate: 5,
    monthlyPayment: 2000,
    type: 'loan',
    ...over,
  }
}

describe('uniqueGjeldName', () => {
  it('returns trimmed name when free', () => {
    expect(uniqueGjeldName('Boliglån', ['Mat'])).toBe('Boliglån')
  })
  it('suffixes when taken', () => {
    expect(uniqueGjeldName('Boliglån', ['Boliglån'])).toBe('Boliglån (2)')
  })
})

describe('clampSyncBudgetFromMonth1', () => {
  it('clamps to 1–12', () => {
    expect(clampSyncBudgetFromMonth1(undefined)).toBe(1)
    expect(clampSyncBudgetFromMonth1(0)).toBe(1)
    expect(clampSyncBudgetFromMonth1(6)).toBe(6)
    expect(clampSyncBudgetFromMonth1(99)).toBe(12)
  })
})

describe('budgetedFromMonthlyFromMonth', () => {
  it('zeros months before start', () => {
    const arr = budgetedFromMonthlyFromMonth(1000, 6)
    expect(arr.slice(0, 5).every((x) => x === 0)).toBe(true)
    expect(arr.slice(5).every((x) => x === 1000)).toBe(true)
  })
  it('start 1 fills all months', () => {
    const arr = budgetedFromMonthlyFromMonth(500, 1)
    expect(arr.every((x) => x === 500)).toBe(true)
  })
})

describe('normalizeDebtLinkedBudgetCategoriesToFullYear', () => {
  it('sets full monthly budget for gjeld linked to debt', () => {
    const partial = budgetedFromMonthlyFromMonth(2000, 6)
    const out = normalizeDebtLinkedBudgetCategoriesToFullYear({
      transactions: [],
      budgetCategories: [
        {
          id: 'c1',
          name: 'Lån',
          budgeted: partial,
          spent: 0,
          type: 'expense',
          color: '#333',
          parentCategory: 'gjeld',
          frequency: 'monthly',
        },
      ],
      ...emptyLabelLists(),
      savingsGoals: [],
      debts: [
        baseDebt({
          linkedBudgetCategoryId: 'c1',
          syncToBudget: true,
        }),
      ],
      investments: [],
      serviceSubscriptions: [],
    })
    expect(out.budgetCategories[0]?.budgeted.every((b) => b === 2000)).toBe(true)
  })
})

describe('effectiveDebtMonthlyPayment', () => {
  it('returns monthly when not paused', () => {
    expect(effectiveDebtMonthlyPayment(baseDebt({ repaymentPaused: false }))).toBe(2000)
  })
  it('returns 0 when repaymentPaused', () => {
    expect(effectiveDebtMonthlyPayment(baseDebt({ repaymentPaused: true }))).toBe(0)
  })
})

describe('buildPlannedDebtTransactions', () => {
  it('creates 12 rows for full year', () => {
    const txs = buildPlannedDebtTransactions({
      debtId: 'd1',
      label: 'Test',
      categoryName: 'Test kat',
      profileId: 'p1',
      amountMonthly: 1000,
      budgetYear: 2026,
      startMonth1: 1,
      endMonth1: 12,
      dayOfMonth: 15,
    })
    expect(txs).toHaveLength(12)
    expect(txs[0]?.linkedDebtId).toBe('d1')
    expect(txs[0]?.category).toBe('Test kat')
    expect(txs[0]?.date).toBe('2026-01-15')
    expect(txs[11]?.date).toBe('2026-12-15')
  })
  it('creates rows from june to december when startMonth 6', () => {
    const txs = buildPlannedDebtTransactions({
      debtId: 'd1',
      label: 'Test',
      categoryName: 'Kat',
      profileId: 'p1',
      amountMonthly: 500,
      budgetYear: 2026,
      startMonth1: 6,
      endMonth1: 12,
      dayOfMonth: 3,
    })
    expect(txs).toHaveLength(7)
    expect(txs[0]?.date).toBe('2026-06-03')
  })
})

describe('appendDebtPlannedTransactionsForBudgetYear', () => {
  it('appends planned txs for synced debt', () => {
    const person = appendDebtPlannedTransactionsForBudgetYear(
      {
        transactions: [],
        budgetCategories: [
          {
            id: 'c1',
            name: 'Min gjeld',
            budgeted: Array(12).fill(2000),
            spent: 0,
            type: 'expense',
            color: '#333',
            parentCategory: 'gjeld',
            frequency: 'monthly',
          },
        ],
        ...emptyLabelLists(),
        savingsGoals: [],
        debts: [
          baseDebt({
            linkedBudgetCategoryId: 'c1',
            syncToBudget: true,
            syncPlannedTransactions: true,
            plannedPaymentDayOfMonth: 10,
          }),
        ],
        investments: [],
        serviceSubscriptions: [],
      },
      2026,
      'p1',
    )
    expect(person.transactions.filter((t) => t.linkedDebtId === 'd1')).toHaveLength(12)
  })
})
