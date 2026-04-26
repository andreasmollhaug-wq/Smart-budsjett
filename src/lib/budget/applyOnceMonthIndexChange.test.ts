import { describe, expect, it, vi } from 'vitest'
import type { BudgetCategory } from '@/lib/store'
import {
  applyOnceMonthIndexChange,
  getOnceLineDisplayMonthIndex,
} from '@/lib/budget/applyOnceMonthIndexChange'

describe('getOnceLineDisplayMonthIndex', () => {
  it('bruker onceMonthIndex når satt', () => {
    const c = {
      frequency: 'once' as const,
      onceMonthIndex: 7,
      budgeted: [0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0],
    } as BudgetCategory
    expect(getOnceLineDisplayMonthIndex(c)).toBe(7)
  })

  it('faller tilbake til første måned med beløp > 0', () => {
    const c = {
      frequency: 'once' as const,
      budgeted: [0, 0, 0, 0, 0, 0, 5000, 0, 0, 0, 0, 0],
    } as BudgetCategory
    expect(getOnceLineDisplayMonthIndex(c)).toBe(6)
  })
})

describe('applyOnceMonthIndexChange', () => {
  it('flytter utgift engang uten trekk til annen måned', () => {
    const update = vi.fn()
    const cat: BudgetCategory = {
      id: 'a',
      name: 'Test',
      frequency: 'once',
      onceMonthIndex: 2,
      budgeted: budget12(0, 2, 1000),
      parentCategory: 'utgifter',
      type: 'expense',
      spent: 0,
      color: '#000',
    }
    const r = applyOnceMonthIndexChange(
      {
        category: cat,
        newMonthIndex: 8,
        isHouseholdAggregate: false,
        activeProfileId: 'p1',
        useIncomeWithholding: false,
      },
      { updateBudgetCategory: update, resplitSharedHouseholdGroupFromTotals: vi.fn() },
    )
    expect(r).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith('a', {
      budgeted: expect.any(Array),
      onceMonthIndex: 8,
    })
    const call = update.mock.calls[0][1]
    expect(call.budgeted[8]).toBe(1000)
    expect(call.budgeted.reduce((s: number, v: number) => s + v, 0)).toBe(1000)
  })

  it('bruker trekk-sti for inntekt med forenklet trekk', () => {
    const update = vi.fn()
    const cat: BudgetCategory = {
      id: 'inc',
      name: 'Lønn',
      frequency: 'once',
      onceMonthIndex: 1,
      parentCategory: 'inntekter',
      type: 'income',
      budgeted: budget12(0, 1, 100_000),
      incomeWithholding: { apply: true, percent: 32 },
      spent: 0,
      color: '#000',
    }
    const r = applyOnceMonthIndexChange(
      {
        category: cat,
        newMonthIndex: 5,
        isHouseholdAggregate: false,
        activeProfileId: 'p1',
        useIncomeWithholding: true,
      },
      { updateBudgetCategory: update, resplitSharedHouseholdGroupFromTotals: vi.fn() },
    )
    expect(r).toEqual({ ok: true })
    const newB = update.mock.calls[0][1].budgeted as number[]
    expect(newB[5]).toBeGreaterThan(0)
    expect(newB[1]).toBe(0)
  })

  it('kaller resplit for delt husholdning engang', () => {
    const resplit = vi.fn(() => ({ ok: true } as const))
    const cat: BudgetCategory = {
      id: 'sh',
      name: 'Del',
      frequency: 'once',
      onceMonthIndex: 3,
      budgeted: budget12(0, 3, 5000),
      parentCategory: 'regninger',
      type: 'expense',
      spent: 0,
      color: '#000',
      householdSplit: {
        groupId: 'g1',
        mode: 'equal',
        participantProfileIds: ['a', 'b'],
      },
    }
    const r = applyOnceMonthIndexChange(
      {
        category: cat,
        newMonthIndex: 9,
        isHouseholdAggregate: false,
        activeProfileId: 'a',
        useIncomeWithholding: false,
      },
      { updateBudgetCategory: vi.fn(), resplitSharedHouseholdGroupFromTotals: resplit },
    )
    expect(r).toEqual({ ok: true })
    expect(resplit).toHaveBeenCalledWith('g1', expect.any(Array), cat.householdSplit)
    const firstCall = resplit.mock.calls[0] as unknown as [string, number[], object]
    const total = firstCall[1]
    expect(total[9]).toBe(10_000)
    expect(total.reduce((s, v) => s + v, 0)).toBe(10_000)
  })

  it('returnerer no_change når måned er uendret', () => {
    const cat: BudgetCategory = {
      id: 'x',
      name: 'X',
      frequency: 'once',
      onceMonthIndex: 4,
      budgeted: budget12(0, 4, 100),
      parentCategory: 'utgifter',
      type: 'expense',
      spent: 0,
      color: '#000',
    }
    const r = applyOnceMonthIndexChange(
      {
        category: cat,
        newMonthIndex: 4,
        isHouseholdAggregate: false,
        activeProfileId: 'p',
        useIncomeWithholding: false,
      },
      { updateBudgetCategory: vi.fn(), resplitSharedHouseholdGroupFromTotals: vi.fn() },
    )
    expect(r).toEqual({ ok: false, reason: 'no_change' })
  })
})

function budget12(fill: number, at: number, value: number): number[] {
  const a = Array(12).fill(fill)
  a[at] = value
  return a
}
