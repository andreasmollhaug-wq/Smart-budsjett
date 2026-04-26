import { describe, expect, it } from 'vitest'
import { canProfileActOnTask, periodKeyForRecurrence, poolForTask, nextRoundRobinIndex } from './hjemflytLogic'
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
