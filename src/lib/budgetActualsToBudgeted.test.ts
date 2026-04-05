import { describe, expect, it } from 'vitest'
import { actualsPerMonthForCategoryAllProfiles } from './budgetActualsToBudgeted'
import type { Transaction } from './store'

describe('actualsPerMonthForCategoryAllProfiles', () => {
  it('summerer på tvers av profiler for samme kategori', () => {
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-03-10',
        description: 'x',
        amount: 100,
        category: 'Husleie',
        type: 'expense',
        profileId: 'p1',
      },
      {
        id: 'b',
        date: '2026-03-12',
        description: 'y',
        amount: 200,
        category: 'Husleie',
        type: 'expense',
        profileId: 'p2',
      },
    ]
    const m = actualsPerMonthForCategoryAllProfiles(transactions, 2026, 'Husleie', 'expense')
    expect(m[2]).toBe(300)
    expect(m[0]).toBe(0)
  })

  it('ignorerer ugyldig dato', () => {
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '',
        description: 'x',
        amount: 50,
        category: 'Mat',
        type: 'expense',
      },
    ]
    const m = actualsPerMonthForCategoryAllProfiles(transactions, 2026, 'Mat', 'expense')
    expect(m.every((x) => x === 0)).toBe(true)
  })
})
