import { describe, expect, it } from 'vitest'
import {
  approvedPointsThisWeek,
  pendingPointsThisWeek,
  periodLabelForWeek,
  weekBoundsMondaySunday,
  weekGoalProgressPercent,
} from './hjemflytStats'
import type { HjemflytCompletion } from './types'

describe('hjemflytStats', () => {
  it('weekBoundsMondaySunday spans Monday to Sunday', () => {
    const wed = new Date(2026, 3, 8, 15, 0, 0)
    const { start, end } = weekBoundsMondaySunday(wed)
    expect(start.getDay()).toBe(1)
    expect(end.getDay()).toBe(0)
    expect(start.getDate()).toBe(6)
    expect(end.getDate()).toBe(12)
  })

  it('sums approved points in week for profile', () => {
    const at = new Date(2026, 3, 8)
    const completions: HjemflytCompletion[] = [
      {
        id: '1',
        taskId: 't',
        completedAt: new Date(2026, 3, 7, 12, 0, 0).toISOString(),
        completedByProfileId: 'p1',
        status: 'approved',
        periodKey: null,
        rewardPointsSnapshot: 10,
      },
      {
        id: '2',
        taskId: 't',
        completedAt: new Date(2026, 3, 13, 12, 0, 0).toISOString(),
        completedByProfileId: 'p1',
        status: 'approved',
        periodKey: null,
        rewardPointsSnapshot: 5,
      },
    ]
    expect(approvedPointsThisWeek('p1', completions, at)).toBe(10)
  })

  it('sums pending points in week', () => {
    const at = new Date(2026, 3, 8)
    const completions: HjemflytCompletion[] = [
      {
        id: '1',
        taskId: 't',
        completedAt: new Date(2026, 3, 7, 12, 0, 0).toISOString(),
        completedByProfileId: 'p1',
        status: 'pending_approval',
        periodKey: null,
        rewardPointsSnapshot: 3,
      },
    ]
    expect(pendingPointsThisWeek('p1', completions, at)).toBe(3)
  })

  it('weekGoalProgressPercent caps at 100', () => {
    expect(weekGoalProgressPercent(50, 40)).toBe(100)
    expect(weekGoalProgressPercent(20, 100)).toBe(20)
    expect(weekGoalProgressPercent(10, null)).toBeNull()
  })

  it('periodLabelForWeek returns nb string', () => {
    const s = periodLabelForWeek(new Date(2026, 3, 8))
    expect(s).toMatch(/2026/)
  })
})
