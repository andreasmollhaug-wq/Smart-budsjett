import { describe, expect, it } from 'vitest'
import { createEmptyPersonData, type Transaction } from '@/lib/store'
import {
  applySubscriptionCancellationsToBudgetForYear,
  buildPlannedSubscriptionTransactions,
  clampBillingDay,
  formatBudgetDateIso,
  inclusiveMonthRangeInYear,
  parseIsoYearMonth,
  transactionMatchesCancellationRemoval,
  zeroBudgetedFromCancellationMonth,
} from './subscriptionTransactions'

describe('clampBillingDay', () => {
  it('begrenser til 1–31', () => {
    expect(clampBillingDay(0)).toBe(1)
    expect(clampBillingDay(29)).toBe(29)
    expect(clampBillingDay(31)).toBe(31)
    expect(clampBillingDay(99)).toBe(31)
    expect(clampBillingDay(15)).toBe(15)
  })
})

describe('formatBudgetDateIso', () => {
  it('bygger yyyy-mm-dd', () => {
    expect(formatBudgetDateIso(2026, 4, 9)).toBe('2026-04-09')
  })
  it('klipper dag til siste i måneden (februar)', () => {
    expect(formatBudgetDateIso(2026, 2, 31)).toBe('2026-02-28')
    expect(formatBudgetDateIso(2024, 2, 31)).toBe('2024-02-29')
  })
})

describe('inclusiveMonthRangeInYear', () => {
  it('april–desember', () => {
    const r = inclusiveMonthRangeInYear(4, 12)
    expect(r.length).toBe(9)
    expect(r[0]).toEqual({ month1: 4 })
    expect(r[r.length - 1]).toEqual({ month1: 12 })
  })
  it('tom ved ugyldig rekkefølge', () => {
    expect(inclusiveMonthRangeInYear(6, 3)).toEqual([])
  })
})

describe('buildPlannedSubscriptionTransactions', () => {
  it('lager én rad per måned med lenket id', () => {
    const txs = buildPlannedSubscriptionTransactions({
      subscriptionId: 'sub-1',
      label: 'Test',
      categoryName: 'Test (Regninger)',
      profileId: 'p1',
      amountNok: 300,
      billing: 'monthly',
      budgetYear: 2026,
      startMonth1: 3,
      endMonth1: 5,
      dayOfMonth: 10,
    })
    expect(txs).toHaveLength(3)
    expect(txs[0]!.date).toBe('2026-03-10')
    expect(txs[0]!.linkedServiceSubscriptionId).toBe('sub-1')
    expect(txs[0]!.amount).toBe(300)
    expect(txs[0]!.type).toBe('expense')
  })
})

describe('zeroBudgetedFromCancellationMonth', () => {
  it('null ut fra august (8)', () => {
    const b = Array(12).fill(100) as number[]
    const z = zeroBudgetedFromCancellationMonth(b, 8)
    expect(z.slice(0, 7).every((x) => x === 100)).toBe(true)
    expect(z.slice(7).every((x) => x === 0)).toBe(true)
  })
  it('juli (7) null ut fra indeks 6', () => {
    const b = Array(12).fill(50) as number[]
    const z = zeroBudgetedFromCancellationMonth(b, 7)
    expect(z.slice(0, 6).every((x) => x === 50)).toBe(true)
    expect(z.slice(6).every((x) => x === 0)).toBe(true)
  })
})

describe('parseIsoYearMonth', () => {
  it('parser dato', () => {
    expect(parseIsoYearMonth('2026-04-09')).toEqual({ year: 2026, month: 4 })
  })
  it('null ved ugyldig', () => {
    expect(parseIsoYearMonth('bad')).toBeNull()
  })
})

describe('transactionMatchesCancellationRemoval', () => {
  const mk = (d: string): Transaction => ({
    id: '1',
    date: d,
    description: 'x',
    amount: 100,
    category: 'c',
    type: 'expense',
    profileId: 'p',
    linkedServiceSubscriptionId: 'sub-1',
  })
  it('samme år: fra og med avslutningsmåned', () => {
    expect(transactionMatchesCancellationRemoval(mk('2026-07-01'), 'sub-1', 2026, 7)).toBe(true)
    expect(transactionMatchesCancellationRemoval(mk('2026-06-15'), 'sub-1', 2026, 7)).toBe(false)
  })
  it('senere år', () => {
    expect(transactionMatchesCancellationRemoval(mk('2027-01-01'), 'sub-1', 2026, 7)).toBe(true)
  })
})

describe('applySubscriptionCancellationsToBudgetForYear', () => {
  it('null ut budsjett når avslutningsår matcher', () => {
    const person = {
      ...createEmptyPersonData(),
      budgetCategories: [
        {
          id: 'cat-1',
          name: 'Netflix',
          budgeted: Array(12).fill(200),
          spent: 0,
          type: 'expense' as const,
          color: '#000',
          parentCategory: 'regninger' as const,
          frequency: 'monthly' as const,
        },
      ],
      serviceSubscriptions: [
        {
          id: 's1',
          label: 'Netflix',
          amountNok: 200,
          billing: 'monthly' as const,
          active: false,
          syncToBudget: true,
          linkedBudgetCategoryId: 'cat-1',
          cancelledFrom: { year: 2026, month: 6 },
        },
      ],
    }
    const next = applySubscriptionCancellationsToBudgetForYear(person, 2026)
    const b = next.budgetCategories[0]!.budgeted
    expect(b.slice(0, 5).every((x) => x === 200)).toBe(true)
    expect(b.slice(5).every((x) => x === 0)).toBe(true)
  })
})
