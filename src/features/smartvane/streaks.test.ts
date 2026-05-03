import { describe, expect, it } from 'vitest'
import { currentStreakFromAnchor, currentStreakUpto, longestStreak } from './streaks'

describe('currentStreakFromAnchor', () => {
  it('returnerer 0 hvis anchor ikke er fullført', () => {
    expect(currentStreakFromAnchor(['2025-01-01'], '2025-01-03')).toBe(0)
  })

  it('teller sammenhengende dager bakover fra anchor', () => {
    const dates = ['2025-01-01', '2025-01-02', '2025-01-03']
    expect(currentStreakFromAnchor(dates, '2025-01-03')).toBe(3)
    expect(currentStreakFromAnchor(dates, '2025-01-02')).toBe(2)
  })

  it('stopper ved hull', () => {
    const dates = ['2025-01-01', '2025-01-03']
    expect(currentStreakFromAnchor(dates, '2025-01-03')).toBe(1)
  })
})

describe('currentStreakUpto', () => {
  it('teller fra siste fullførte på eller før asOf', () => {
    const dates = ['2025-01-05', '2025-01-06', '2025-01-08']
    expect(currentStreakUpto(dates, '2025-01-08')).toBe(1)
    expect(currentStreakUpto(dates, '2025-01-07')).toBe(2)
  })
})

describe('longestStreak', () => {
  it('tom liste → 0', () => {
    expect(longestStreak([])).toBe(0)
  })

  it('finner lengste kjede', () => {
    expect(longestStreak(['2025-01-01', '2025-01-02', '2025-01-04', '2025-01-05'])).toBe(2)
  })

  it('sammenhengende dager på tvers av månedsskifte', () => {
    expect(longestStreak(['2025-01-30', '2025-01-31', '2025-02-01'])).toBe(3)
  })
})
