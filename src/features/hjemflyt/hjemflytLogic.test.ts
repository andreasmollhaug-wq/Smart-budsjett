import { describe, expect, it } from 'vitest'
import {
  canProfileActOnTask,
  partitionTasksForProfile,
  periodKeyForRecurrence,
  poolForTask,
  nextRoundRobinIndex,
} from './hjemflytLogic'
import type { HjemflytTask } from './types'

const baseTask = (o: Partial<HjemflytTask>): HjemflytTask => ({
  id: 'a',
  title: 'Oppgave',
  rewardPoints: null,
  recurrence: { type: 'none' },
  assignMode: 'everyone',
  assigneeProfileIds: [],
  roundRobinIndex: 0,
  lastCompletedAt: null,
  lastCompletedPeriodKey: null,
  createdAt: new Date().toISOString(),
  createdByProfileId: 'default',
  ...o,
})

describe('periodKeyForRecurrence', () => {
  it('is stable for daily', () => {
    const d = new Date(2026, 3, 26)
    const k1 = periodKeyForRecurrence({ type: 'daily' }, d, 't')
    const k2 = periodKeyForRecurrence({ type: 'daily' }, d, 't')
    expect(k1).toBe(k2)
    expect(k1).toMatch(/^d:/)
  })
})

describe('canProfileActOnTask', () => {
  const pids = ['default', 'p2', 'p3']
  it('everyone: any profile in household', () => {
    const t = baseTask({ assignMode: 'everyone' })
    expect(canProfileActOnTask(t, 'p2', pids)).toBe(true)
  })
  it('round robin: only current turn', () => {
    const t = baseTask({
      assignMode: 'round_robin',
      assigneeProfileIds: ['p2', 'p3'],
      roundRobinIndex: 0,
    })
    expect(canProfileActOnTask(t, 'p2', pids)).toBe(true)
    expect(canProfileActOnTask(t, 'p3', pids)).toBe(false)
  })
  it('increments round robin', () => {
    const t = baseTask({
      assignMode: 'round_robin',
      assigneeProfileIds: ['p2', 'p3'],
      roundRobinIndex: 0,
    })
    const pl = poolForTask(t, pids)
    expect(nextRoundRobinIndex(t, pl)).toBe(1)
  })
})

describe('partitionTasksForProfile', () => {
  const pids = ['default', 'p2', 'p3']

  it('everyone: alle oppgaver er actionable for alle profiler', () => {
    const tasks = [baseTask({ id: '1' }), baseTask({ id: '2' })]
    for (const pid of pids) {
      const { actionable, notActionable } = partitionTasksForProfile(tasks, pid, pids)
      expect(actionable).toHaveLength(2)
      expect(notActionable).toHaveLength(0)
    }
  })

  it('round_robin: kun nåværende tur i actionable', () => {
    const tasks = [
      baseTask({
        id: 'rr',
        assignMode: 'round_robin',
        assigneeProfileIds: ['p2', 'p3'],
        roundRobinIndex: 0,
      }),
    ]
    const forP2 = partitionTasksForProfile(tasks, 'p2', pids)
    expect(forP2.actionable).toHaveLength(1)
    expect(forP2.notActionable).toHaveLength(0)
    const forP3 = partitionTasksForProfile(tasks, 'p3', pids)
    expect(forP3.actionable).toHaveLength(0)
    expect(forP3.notActionable).toHaveLength(1)
  })

  it('fixed: profil utenfor utvalg får oppgaven i notActionable', () => {
    const tasks = [
      baseTask({
        id: 'fx',
        assignMode: 'fixed',
        assigneeProfileIds: ['p2'],
      }),
    ]
    const forP2 = partitionTasksForProfile(tasks, 'p2', pids)
    expect(forP2.actionable).toHaveLength(1)
    const forP3 = partitionTasksForProfile(tasks, 'p3', pids)
    expect(forP3.actionable).toHaveLength(0)
    expect(forP3.notActionable).toHaveLength(1)
  })
})
