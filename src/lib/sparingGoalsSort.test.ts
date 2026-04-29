import { describe, expect, it } from 'vitest'
import type { SavingsGoal } from '@/lib/store'
import { sortSavingsGoalsForDisplay, type SparingGoalSortRow } from './sparingGoalsSort'

function g(partial: Pick<SavingsGoal, 'id' | 'name'> & Partial<SavingsGoal>): SavingsGoal {
  return {
    targetAmount: 10_000,
    currentAmount: 0,
    targetDate: '',
    color: '#000',
    deposits: [],
    ...partial,
  } as SavingsGoal
}

function sortIds(rows: SparingGoalSortRow[], mode: Parameters<typeof sortSavingsGoalsForDisplay>[1]): string[] {
  return sortSavingsGoalsForDisplay(rows, mode).map((x) => x.id)
}

describe('sortSavingsGoalsForDisplay', () => {
  it('sorterer på navn A–Å (nb)', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: '1', name: 'Charlie' }), effective: 0, progress: 0 },
      { goal: g({ id: '2', name: 'alfa' }), effective: 0, progress: 0 },
      { goal: g({ id: '3', name: 'Bravo' }), effective: 0, progress: 0 },
    ]
    expect(sortIds(rows, 'name_asc')).toEqual(['2', '3', '1'])
  })

  it('sorterer spart beløp størst først', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: 'a', name: 'X' }), effective: 100, progress: 10 },
      { goal: g({ id: 'b', name: 'Y' }), effective: 500, progress: 50 },
      { goal: g({ id: 'c', name: 'Z' }), effective: 300, progress: 30 },
    ]
    expect(sortIds(rows, 'saved_desc')).toEqual(['b', 'c', 'a'])
    expect(sortIds(rows, 'saved_asc')).toEqual(['a', 'c', 'b'])
  })

  it('sorterer på målbeløp (registrert målsum), ikke spart sum', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: 'syden', name: 'Syden', targetAmount: 25_000 }), effective: 5000, progress: 20 },
      { goal: g({ id: 'bil', name: 'Bil', targetAmount: 100_000 }), effective: 99_000, progress: 99 },
      { goal: g({ id: 'lav', name: 'Lav', targetAmount: 10_000 }), effective: 9000, progress: 90 },
    ]
    expect(sortIds(rows, 'targetAmount_desc')).toEqual(['bil', 'syden', 'lav'])
    expect(sortIds(rows, 'targetAmount_asc')).toEqual(['lav', 'syden', 'bil'])
  })

  it('ved lik progress: høyere effektiv sum først (tie-break)', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: 'low', name: 'A' }), effective: 100, progress: 50 },
      { goal: g({ id: 'high', name: 'B' }), effective: 400, progress: 50 },
    ]
    expect(sortIds(rows, 'progress_asc')).toEqual(['high', 'low'])
    expect(sortIds(rows, 'progress_desc')).toEqual(['high', 'low'])
  })

  it('ved lik effektiv sum: høyere progress først som sekundær sortering', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: 'p10', name: 'A' }), effective: 200, progress: 10 },
      { goal: g({ id: 'p90', name: 'B' }), effective: 200, progress: 90 },
    ]
    expect(sortIds(rows, 'saved_asc')).toEqual(['p90', 'p10'])
  })

  it('sorterer måldato nærmest først; uten dato sist', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: 'far', name: 'A', targetDate: '2027-01-01' }), effective: 0, progress: 0 },
      { goal: g({ id: 'none', name: 'B', targetDate: '' }), effective: 0, progress: 0 },
      { goal: g({ id: 'near', name: 'C', targetDate: '2026-06-01' }), effective: 0, progress: 0 },
    ]
    expect(sortIds(rows, 'targetDate_asc')).toEqual(['near', 'far', 'none'])
  })

  it('sorterer måldato lengst unna først; uten dato sist', () => {
    const rows: SparingGoalSortRow[] = [
      { goal: g({ id: 'near', name: 'A', targetDate: '2026-06-01' }), effective: 0, progress: 0 },
      { goal: g({ id: 'none', name: 'B', targetDate: '' }), effective: 0, progress: 0 },
      { goal: g({ id: 'far', name: 'C', targetDate: '2028-01-01' }), effective: 0, progress: 0 },
    ]
    expect(sortIds(rows, 'targetDate_desc')).toEqual(['far', 'near', 'none'])
  })
})
