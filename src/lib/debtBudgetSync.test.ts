import { describe, expect, it } from 'vitest'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import type { Debt } from '@/lib/store'
import {
  appendDebtPlannedTransactionsForBudgetYear,
  budgetedFromMonthlyFromMonth,
  buildDebtLinkedBudgetedTwelve,
  buildPlannedDebtTransactions,
  clampSyncBudgetFromMonth1,
  normalizeDebtLinkedBudgetCategoriesToFullYear,
  uniqueGjeldName,
} from '@/lib/debtBudgetSync'
import { rawDebtMonthlyPayment } from '@/lib/debtHelpers'

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

describe('rawDebtMonthlyPayment', () => {
  it('returns monthly from debt', () => {
    expect(rawDebtMonthlyPayment(baseDebt({ repaymentPaused: false }))).toBe(2000)
  })
  it('returns monthly even when repaymentPaused with date (budsjett bruker per måned)', () => {
    expect(rawDebtMonthlyPayment(baseDebt({ repaymentPaused: true, pauseEndDate: '2026-06-14' }))).toBe(2000)
  })
})

describe('buildDebtLinkedBudgetedTwelve', () => {
  it('fills all months when no pause and sync from 1', () => {
    const arr = buildDebtLinkedBudgetedTwelve(baseDebt(), 2026, 1)
    expect(arr.every((b) => b === 2000)).toBe(true)
  })
  it('pause til 14/06: jan–mai 0, juni–des beløp når synk fra juni', () => {
    const arr = buildDebtLinkedBudgetedTwelve(
      baseDebt({ pauseEndDate: '2026-06-14', repaymentPaused: false }),
      2026,
      6,
    )
    expect(arr.slice(0, 5).every((b) => b === 0)).toBe(true)
    expect(arr.slice(5).every((b) => b === 2000)).toBe(true)
  })
  it('pause til 14/06: jan–mai 0, juni–des når synk fra 1', () => {
    const arr = buildDebtLinkedBudgetedTwelve(
      baseDebt({ pauseEndDate: '2026-06-14', repaymentPaused: false }),
      2026,
      1,
    )
    expect(arr.slice(0, 5).every((b) => b === 0)).toBe(true)
    expect(arr.slice(5).every((b) => b === 2000)).toBe(true)
  })
  it('hele 2025 er 0 når pause til 14/06/2026', () => {
    const arr = buildDebtLinkedBudgetedTwelve(
      baseDebt({ pauseEndDate: '2026-06-14', repaymentPaused: false }),
      2025,
      1,
    )
    expect(arr.every((b) => b === 0)).toBe(true)
  })
  it('uendelig pause uten dato: alle 0', () => {
    const arr = buildDebtLinkedBudgetedTwelve(baseDebt({ repaymentPaused: true }), 2026, 1)
    expect(arr.every((b) => b === 0)).toBe(true)
  })
})

describe('normalizeDebtLinkedBudgetCategoriesToFullYear', () => {
  it('sets monthly budget for gjeld linked to debt (full year)', () => {
    const out = normalizeDebtLinkedBudgetCategoriesToFullYear(
      {
        transactions: [],
        budgetCategories: [
          {
            id: 'c1',
            name: 'Lån',
            budgeted: budgetedFromMonthlyFromMonth(2000, 6),
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
            syncBudgetFromMonth1: 1,
          }),
        ],
        investments: [],
        serviceSubscriptions: [],
      },
      2026,
    )
    expect(out.budgetCategories[0]?.budgeted.every((b) => b === 2000)).toBe(true)
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
  it('pause til midten av juni: 7 trekk fra juni når synk fra 6, første dato 2026-06-15', () => {
    const person = appendDebtPlannedTransactionsForBudgetYear(
      {
        transactions: [],
        budgetCategories: [
          {
            id: 'c1',
            name: 'Pause-lån',
            budgeted: Array(12).fill(0),
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
            id: 'dpause',
            linkedBudgetCategoryId: 'c1',
            syncToBudget: true,
            syncPlannedTransactions: true,
            plannedPaymentDayOfMonth: 15,
            syncBudgetFromMonth1: 6,
            pauseEndDate: '2026-06-14',
            repaymentPaused: false,
          }),
        ],
        investments: [],
        serviceSubscriptions: [],
      },
      2026,
      'p1',
    )
    const txs = person.transactions.filter((t) => t.linkedDebtId === 'dpause')
    expect(txs).toHaveLength(7)
    expect(txs[0]?.date).toBe('2026-06-15')
    expect(txs[0]?.amount).toBe(2000)
  })
})
