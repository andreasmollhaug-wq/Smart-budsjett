import { describe, expect, it } from 'vitest'
import { buildSavingsGoalPaceSummary, calendarDaysUntilTarget } from '@/lib/savingsDerived'

describe('calendarDaysUntilTarget', () => {
  it('returnerer 0 på samme kalenderdag', () => {
    const t = new Date(2026, 3, 15, 14, 0, 0).getTime()
    expect(calendarDaysUntilTarget('2026-04-15', t)).toBe(0)
  })

  it('returnerer negativ når måldato er passert', () => {
    const t = new Date(2026, 3, 20, 12, 0, 0).getTime()
    expect(calendarDaysUntilTarget('2026-04-10', t)).toBeLessThan(0)
  })
})

describe('buildSavingsGoalPaceSummary', () => {
  /** 1. juni 2026 lokaltid */
  const june1 = new Date(2026, 5, 1, 12, 0, 0).getTime()

  it('no_date uten måldato', () => {
    const s = buildSavingsGoalPaceSummary(10_000, '', june1)
    expect(s.status).toBe('no_date')
    expect(s.weeklyNok).toBeNull()
  })

  it('goal_met når ingenting gjenstår', () => {
    const s = buildSavingsGoalPaceSummary(0, '2026-12-01', june1)
    expect(s.status).toBe('goal_met')
    expect(s.weeklyNok).toBeNull()
  })

  it('past_date når frist passert og beløp gjenstår', () => {
    const s = buildSavingsGoalPaceSummary(5000, '2026-04-01', june1)
    expect(s.status).toBe('past_date')
    expect(s.weeklyNok).toBeNull()
  })

  it('ok med ukentlig og månedlig snitt', () => {
    const s = buildSavingsGoalPaceSummary(7000, '2026-07-01', june1)
    expect(s.status).toBe('ok')
    expect(s.daysLeft).toBe(30)
    expect(s.weeklyNok).toBe(Math.round((7000 * 7) / 30))
    expect(s.monthlyNok).toBe(Math.round((7000 * (365.25 / 12)) / 30))
  })
})
