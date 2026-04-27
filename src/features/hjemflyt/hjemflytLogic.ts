import type { HjemflytRecurrence, HjemflytTask } from './types'

/**
 * Stabil periode-nøkkel for idempotens (én «runde» per oppgave per periode).
 */
export function periodKeyForRecurrence(recurrence: HjemflytRecurrence, at: Date, taskId: string): string {
  const y = at.getFullYear()
  const m = at.getMonth()
  const day = at.getDate()
  if (recurrence.type === 'none') {
    return `once-${taskId}`
  }
  if (recurrence.type === 'daily') {
    return `d:${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  if (recurrence.type === 'weekly') {
    const t = new Date(at)
    t.setHours(0, 0, 0, 0)
    const dow = t.getDay()
    const monday = new Date(t)
    const offset = (dow + 6) % 7
    monday.setDate(t.getDate() - offset)
    return `w:${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}-wd${recurrence.weekday}`
  }
  if (recurrence.type === 'monthly') {
    return `m:${y}-${String(m + 1).padStart(2, '0')}-d${recurrence.dayOfMonth}`
  }
  return `x:${y}-${m}-${day}`
}

export function poolForTask(task: HjemflytTask, allProfileIds: string[]): string[] {
  const valid = new Set(allProfileIds)
  if (task.assignMode === 'everyone') {
    return allProfileIds.slice()
  }
  if (task.assignMode === 'fixed' || task.assignMode === 'round_robin') {
    const pool = task.assigneeProfileIds.filter((id) => valid.has(id))
    if (pool.length > 0) return pool
    return allProfileIds.slice()
  }
  return allProfileIds.slice()
}

export function currentRoundRobinProfile(task: HjemflytTask, pool: string[]): string | null {
  if (pool.length === 0) return null
  const i = ((task.roundRobinIndex % pool.length) + pool.length) % pool.length
  return pool[i] ?? null
}

export function nextRoundRobinIndex(task: HjemflytTask, pool: string[]): number {
  if (pool.length === 0) return 0
  return (task.roundRobinIndex + 1) % pool.length
}

export function canProfileActOnTask(
  task: HjemflytTask,
  profileId: string,
  allProfileIds: string[],
): boolean {
  const pool = poolForTask(task, allProfileIds)
  if (!pool.includes(profileId)) return false
  if (task.assignMode === 'everyone') return true
  if (task.assignMode === 'fixed') {
    if (task.assigneeProfileIds.length > 0) {
      return task.assigneeProfileIds.includes(profileId) && pool.includes(profileId)
    }
    return pool.includes(profileId)
  }
  if (task.assignMode === 'round_robin') {
    return currentRoundRobinProfile(task, pool) === profileId
  }
  return false
}

/** Deler oppgaver i det valgte profilen kan fullføre nå vs resten (f.eks. barnevisning). */
export function partitionTasksForProfile(
  tasks: HjemflytTask[],
  profileId: string,
  allProfileIds: string[],
): { actionable: HjemflytTask[]; notActionable: HjemflytTask[] } {
  const actionable: HjemflytTask[] = []
  const notActionable: HjemflytTask[] = []
  for (const t of tasks) {
    if (canProfileActOnTask(t, profileId, allProfileIds)) actionable.push(t)
    else notActionable.push(t)
  }
  return { actionable, notActionable }
}
