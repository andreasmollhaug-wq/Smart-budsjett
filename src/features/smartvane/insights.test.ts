import { describe, expect, it } from 'vitest'
import {
  buildDailySummaryPoints,
  strongestAndWeakestWeekday,
  trend7Vs7,
  weekdayStrengthInMonth,
} from './insights'

describe('trend7Vs7', () => {
  it('flat når for lite data', () => {
    expect(trend7Vs7([])).toBe('flat')
  })

  it('opp når siste blokk høyere', () => {
    const pts = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      ratio: i < 7 ? 0.2 : 0.9,
      dailyCompletedCount: i < 7 ? 1 : 9,
      dailyHabitCount: 10,
      dailyGoalTotal: 5,
      dailyGoalMet: i >= 7,
    }))
    expect(trend7Vs7(pts)).toBe('up')
  })
})

describe('weekdayStrengthInMonth', () => {
  it('mandag i jan 2025 starter på onsdag 1 — telle korrekt', () => {
    const map = new Map<string, number>()
    map.set('2025-01-01', 10)
    const points = buildDailySummaryPoints({
      daysInMonth: 3,
      year: 2025,
      month: 1,
      completedCountByDay: map,
      dailyHabitCount: 10,
      dailyGoalTotal: 10,
    })
    const w = weekdayStrengthInMonth(points)
    const wed = w[3]!
    expect(wed.total).toBe(1)
    expect(wed.met).toBe(1)
  })
})

describe('strongestAndWeakestWeekday', () => {
  it('null når ingen data', () => {
    const rows = weekdayStrengthInMonth([])
    expect(strongestAndWeakestWeekday(rows).strongest).toBeNull()
  })
})
