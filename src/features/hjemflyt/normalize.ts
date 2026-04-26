import {
  HJEMFLYT_STATE_VERSION,
  type HjemFlytState,
  type HjemflytCompletion,
  type HjemflytRecurrence,
  type HjemflytTask,
} from './types'

function normalizeTaskRewardPoints(raw: unknown): number | null {
  const o = raw as Record<string, unknown>
  if (o.rewardPoints != null) {
    const v = typeof o.rewardPoints === 'number' ? o.rewardPoints : Number(o.rewardPoints)
    if (!Number.isFinite(v)) return null
    if (v > 0) return Math.min(1_000_000, Math.max(0, Math.round(v)))
    if (v === 0) return 0
    return null
  }
  if (o.rewardNok == null) return null
  const v = typeof o.rewardNok === 'number' ? o.rewardNok : Number(o.rewardNok)
  if (Number.isFinite(v) && v > 0) return Math.min(1_000_000, Math.max(0, Math.round(v)))
  if (v === 0) return 0
  return null
}

export function createEmptyHjemFlytState(): HjemFlytState {
  return {
    version: HJEMFLYT_STATE_VERSION,
    tasks: [],
    completions: [],
    pointBalances: {},
    settings: { showRewardForChildren: true, weeklyGoalPoints: null },
  }
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function normalizeRecurrence(raw: unknown): HjemflytRecurrence {
  if (!raw || typeof raw !== 'object') return { type: 'none' }
  const t = (raw as { type?: string }).type
  if (t === 'daily') return { type: 'daily' }
  if (t === 'weekly') {
    const w = clampInt((raw as { weekday?: number }).weekday, 0, 6, 1)
    return { type: 'weekly', weekday: w }
  }
  if (t === 'monthly') {
    const d = clampInt((raw as { dayOfMonth?: number }).dayOfMonth, 1, 28, 1)
    return { type: 'monthly', dayOfMonth: d }
  }
  return { type: 'none' }
}

function normalizeTask(raw: unknown): HjemflytTask | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<HjemflytTask>
  if (typeof o.id !== 'string' || o.id.length === 0) return null
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  if (title.length === 0) return null
  const rewardPoints = normalizeTaskRewardPoints(raw)
  const am = o.assignMode
  const assignMode =
    am === 'everyone' || am === 'fixed' || am === 'round_robin' ? am : 'everyone'
  const assigneeProfileIds = Array.isArray(o.assigneeProfileIds)
    ? o.assigneeProfileIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : []
  return {
    id: o.id,
    title: title.slice(0, 200),
    rewardPoints,
    recurrence: normalizeRecurrence(o.recurrence),
    assignMode,
    assigneeProfileIds: assigneeProfileIds.slice(0, 20),
    roundRobinIndex: Math.max(0, Math.min(10_000, Math.floor(o.roundRobinIndex ?? 0))),
    lastCompletedAt: typeof o.lastCompletedAt === 'string' ? o.lastCompletedAt : null,
    lastCompletedPeriodKey: typeof o.lastCompletedPeriodKey === 'string' ? o.lastCompletedPeriodKey : null,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
    createdByProfileId: typeof o.createdByProfileId === 'string' ? o.createdByProfileId : 'default',
  }
}

function normalizeCompletion(raw: unknown): HjemflytCompletion | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<HjemflytCompletion>
  if (typeof o.id !== 'string' || !o.id) return null
  if (typeof o.taskId !== 'string' || !o.taskId) return null
  const st = o.status
  const status: HjemflytCompletion['status'] =
    st === 'done' || st === 'pending_approval' || st === 'rejected' || st === 'approved' ? st : 'done'
  let rewardPointsSnapshot: number | null = null
  const snapModern = (raw as { rewardPointsSnapshot?: unknown }).rewardPointsSnapshot
  const snapLegacy = (raw as { rewardNokSnapshot?: unknown }).rewardNokSnapshot
  const pick = snapModern != null ? snapModern : snapLegacy
  if (pick != null) {
    const v = typeof pick === 'number' ? pick : Number(pick)
    rewardPointsSnapshot = Number.isFinite(v) ? Math.max(0, Math.round(v)) : null
  }
  return {
    id: o.id,
    taskId: o.taskId,
    completedAt: typeof o.completedAt === 'string' ? o.completedAt : new Date().toISOString(),
    completedByProfileId:
      typeof o.completedByProfileId === 'string' ? o.completedByProfileId : 'default',
    status,
    periodKey: o.periodKey == null ? null : String(o.periodKey),
    rewardPointsSnapshot,
  }
}

/**
 * Sørger for gyldig HjemFlytState fra persist / ukjent JSON.
 */
export function normalizeHjemFlytState(raw: unknown): HjemFlytState {
  const empty = createEmptyHjemFlytState()
  if (!raw || typeof raw !== 'object') return empty
  const tasksIn = (raw as { tasks?: unknown }).tasks
  const tasks: HjemflytTask[] = Array.isArray(tasksIn)
    ? (tasksIn.map(normalizeTask).filter(Boolean) as HjemflytTask[])
    : []
  const compIn = (raw as { completions?: unknown }).completions
  const completions: HjemflytCompletion[] = Array.isArray(compIn)
    ? (compIn.map(normalizeCompletion).filter(Boolean) as HjemflytCompletion[])
    : []
  const r = raw as { pointBalances?: unknown; balances?: unknown }
  const balIn = r.pointBalances != null ? r.pointBalances : r.balances
  const pointBalances: Record<string, number> = {}
  if (balIn && typeof balIn === 'object' && !Array.isArray(balIn)) {
    for (const [k, val] of Object.entries(balIn as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        pointBalances[k] = Math.max(-1_000_000_000, Math.min(1_000_000_000, Math.round(val)))
      }
    }
  }
  const settingsRaw = (raw as { settings?: Record<string, unknown> }).settings
  const showRewardForChildren =
    settingsRaw?.showRewardForChildren === false ? false : true
  let weeklyGoalPoints: number | null = null
  const wg = settingsRaw?.weeklyGoalPoints
  if (wg != null) {
    const n = typeof wg === 'number' ? wg : Number(wg)
    if (Number.isFinite(n) && n > 0) weeklyGoalPoints = Math.min(1_000_000, Math.round(n))
  }
  return {
    version: HJEMFLYT_STATE_VERSION,
    tasks,
    completions,
    pointBalances,
    settings: { showRewardForChildren, weeklyGoalPoints },
  }
}
