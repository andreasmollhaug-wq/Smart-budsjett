import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  buildMonthlyBudgetActualSeries,
  referenceMonthIndexForBudgetYear,
  sumActualsByMonthForType,
  sumBudgetedByMonthForType,
  sumBudgetedFixedMonthlyExpensesForMonth,
  sumBudgetedIncomeForMonth,
} from './bankReportData'
import type { BudgetCategory, Transaction } from './store'

function cat(overrides: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...overrides,
  } as BudgetCategory
}

describe('buildMonthlyBudgetActualSeries', () => {
  it('returnerer 12 punkter med nuller uten kategorier og transaksjoner', () => {
    const series = buildMonthlyBudgetActualSeries([], 2026, [])
    expect(series).toHaveLength(12)
    for (const p of series) {
      expect(p.budgetedIncome).toBe(0)
      expect(p.budgetedExpense).toBe(0)
      expect(p.actualIncome).toBe(0)
      expect(p.actualExpense).toBe(0)
    }
  })

  it('matcher budsjett og faktisk for én måned', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: [0, 40000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
      cat({
        id: '2',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [0, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-02-15',
        description: 'Lønn',
        amount: 42000,
        category: 'Lønn',
        type: 'income',
      },
      {
        id: 't2',
        date: '2026-02-20',
        description: 'Rema',
        amount: 4800,
        category: 'Mat',
        type: 'expense',
      },
    ]
    const series = buildMonthlyBudgetActualSeries(transactions, 2026, budgetCategories)
    expect(series[0].budgetedIncome).toBe(0)
    expect(series[0].actualExpense).toBe(0)
    expect(series[1].budgetedIncome).toBe(40000)
    expect(series[1].budgetedExpense).toBe(5000)
    expect(series[1].actualIncome).toBe(42000)
    expect(series[1].actualExpense).toBe(4800)
    expect(series[1].label).toBe('Feb')
  })
})

describe('sumActualsByMonthForType og sumBudgetedByMonthForType', () => {
  it('aggererer faktisk inntekt per måned', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-02-01',
        description: 'Lønn',
        amount: 40000,
        category: 'Lønn',
        type: 'income',
      },
    ]
    const actuals = sumActualsByMonthForType(transactions, 2026, 'income')
    expect(actuals[1]).toBe(40000)
    expect(actuals[0]).toBe(0)
  })

  it('aggererer budsjett utgift per måned', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [0, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    const bud = sumBudgetedByMonthForType(budgetCategories, 'expense')
    expect(bud[1]).toBe(5000)
  })
})

describe('referenceMonthIndexForBudgetYear', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('bruker inneværende måned når år matcher', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00'))
    expect(referenceMonthIndexForBudgetYear(2026)).toBe(5)
  })

  it('bruker januar når budsjettår ikke er kalenderår', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00'))
    expect(referenceMonthIndexForBudgetYear(2025)).toBe(0)
  })
})

describe('faste utgifter og inntekt per måned (budsjett)', () => {
  it('summerer kun månedlige utgifter', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Husleie',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'monthly',
        budgeted: Array(12).fill(1000),
      }),
      cat({
        id: '2',
        name: 'Årsavgift',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'yearly',
        budgeted: [12000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    expect(sumBudgetedFixedMonthlyExpensesForMonth(budgetCategories, 0)).toBe(1000)
  })

  it('summerer budsjettert inntekt for én måned', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: [0, 45000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    expect(sumBudgetedIncomeForMonth(budgetCategories, 1)).toBe(45000)
  })
})

