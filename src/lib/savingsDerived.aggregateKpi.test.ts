import { describe, expect, it } from 'vitest'
import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { aggregateSavingsGoalsKpi } from './savingsDerived'

const pid = 'p1'

function goal(partial: Partial<SavingsGoal> & Pick<SavingsGoal, 'id' | 'name'>): SavingsGoal {
  return {
    targetAmount: 10_000,
    currentAmount: 0,
    targetDate: '',
    color: '#000',
    deposits: [],
    ...partial,
  } as SavingsGoal
}

describe('aggregateSavingsGoalsKpi', () => {
  it('tom liste gir 0 og progress 0', () => {
    const r = aggregateSavingsGoalsKpi([], [], [], pid)
    expect(r).toEqual({ totalSaved: 0, totalTarget: 0, progressPct: 0 })
  })

  it('summerer ukoblede mål via currentAmount', () => {
    const goals = [
      goal({ id: 'a', name: 'A', currentAmount: 3000 }),
      goal({ id: 'b', name: 'B', currentAmount: 7000 }),
    ]
    const r = aggregateSavingsGoalsKpi(goals, [], [], pid)
    expect(r.totalSaved).toBe(10_000)
    expect(r.totalTarget).toBe(20_000)
    expect(r.progressPct).toBe(50)
  })

  it('bruker transaksjoner for koblede mål', () => {
    const cat: BudgetCategory = {
      id: 'c1',
      name: 'BSU',
      budgeted: Array(12).fill(0),
      spent: 0,
      type: 'expense',
      color: '#000',
      parentCategory: 'sparing',
      frequency: 'monthly',
    }
    const goals = [
      goal({
        id: 'g1',
        name: 'Mål',
        targetAmount: 5000,
        linkedBudgetCategoryId: 'c1',
        baselineAmount: 1000,
        currentAmount: 0,
      }),
    ]
    const tx: Transaction[] = [
      {
        id: 't1',
        date: '2026-01-01',
        description: 'Inn',
        amount: 500,
        category: 'BSU',
        type: 'expense',
        profileId: pid,
      },
    ]
    const r = aggregateSavingsGoalsKpi(goals, tx, [cat], pid)
    expect(r.totalSaved).toBe(1500)
    expect(r.totalTarget).toBe(5000)
    expect(r.progressPct).toBe(30)
  })
})
