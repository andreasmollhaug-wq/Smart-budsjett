import { describe, expect, it } from 'vitest'
import { createEmptyHjemFlytState, normalizeHjemFlytState } from './normalize'

describe('normalizeHjemFlytState', () => {
  it('returns default for garbage', () => {
    const e = createEmptyHjemFlytState()
    expect(normalizeHjemFlytState(null).tasks).toEqual(e.tasks)
    expect(normalizeHjemFlytState('x').completions).toEqual([])
  })

  it('normalizes a minimal task with legacy rewardNok and balances', () => {
    const s = normalizeHjemFlytState({
      version: 1,
      tasks: [
        {
          id: 't1',
          title: 'Test',
          rewardNok: 20,
          recurrence: { type: 'daily' },
          assignMode: 'everyone',
          assigneeProfileIds: [],
        },
      ],
      completions: [],
      balances: { default: 100 },
    })
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0]!.title).toBe('Test')
    expect(s.tasks[0]!.rewardPoints).toBe(20)
    expect(s.tasks[0]!.roundRobinIndex).toBe(0)
    expect(s.pointBalances.default).toBe(100)
    expect(s.version).toBeGreaterThanOrEqual(2)
  })

  it('migrates rewardPoints on task and pointBalances key', () => {
    const s = normalizeHjemFlytState({
      tasks: [
        {
          id: 't2',
          title: 'Ny',
          rewardPoints: 15,
          recurrence: { type: 'none' },
          assignMode: 'everyone',
          assigneeProfileIds: [],
        },
      ],
      completions: [
        {
          id: 'c1',
          taskId: 't2',
          completedAt: '2026-04-01T12:00:00.000Z',
          completedByProfileId: 'p1',
          status: 'approved',
          periodKey: null,
          rewardPointsSnapshot: 15,
        },
      ],
      pointBalances: { p1: 15 },
      settings: { showRewardForChildren: true, weeklyGoalPoints: 50 },
    })
    expect(s.tasks[0]!.rewardPoints).toBe(15)
    expect(s.completions[0]!.rewardPointsSnapshot).toBe(15)
    expect(s.pointBalances.p1).toBe(15)
    expect(s.settings.weeklyGoalPoints).toBe(50)
  })

  it('migrates completion rewardNokSnapshot to rewardPointsSnapshot', () => {
    const s = normalizeHjemFlytState({
      tasks: [],
      completions: [
        {
          id: 'c1',
          taskId: 't',
          completedAt: '2026-04-01T12:00:00.000Z',
          completedByProfileId: 'p1',
          status: 'approved',
          periodKey: null,
          rewardNokSnapshot: 8,
        },
      ],
      balances: {},
    })
    expect(s.completions[0]!.rewardPointsSnapshot).toBe(8)
  })
})
