import type { HjemflytCompletion } from './types'

/** Mandag 00:00:00.000 – søndag 23:59:59.999 (lokal tid). */
export function weekBoundsMondaySunday(at: Date): { start: Date; end: Date } {
  const start = new Date(at)
  start.setHours(0, 0, 0, 0)
  const dow = start.getDay()
  const offset = (dow + 6) % 7
  start.setDate(start.getDate() - offset)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function approvedPointsThisWeek(
  profileId: string,
  completions: HjemflytCompletion[],
  at: Date,
): number {
  const { start, end } = weekBoundsMondaySunday(at)
  let sum = 0
  for (const c of completions) {
    if (c.status !== 'approved') continue
    if (c.completedByProfileId !== profileId) continue
    const t = new Date(c.completedAt)
    if (!Number.isFinite(t.getTime())) continue
    if (t < start || t > end) continue
    sum += c.rewardPointsSnapshot ?? 0
  }
  return sum
}

export function pendingPointsThisWeek(
  profileId: string,
  completions: HjemflytCompletion[],
  at: Date,
): number {
  const { start, end } = weekBoundsMondaySunday(at)
  let sum = 0
  for (const c of completions) {
    if (c.status !== 'pending_approval') continue
    if (c.completedByProfileId !== profileId) continue
    const t = new Date(c.completedAt)
    if (!Number.isFinite(t.getTime())) continue
    if (t < start || t > end) continue
    sum += c.rewardPointsSnapshot ?? 0
  }
  return sum
}

/** Prosent mot mål; null når mål ikke er satt eller ugyldig. */
export function weekGoalProgressPercent(approved: number, goal: number | null): number | null {
  if (goal == null || goal <= 0) return null
  return Math.min(100, Math.max(0, Math.round((approved / goal) * 100)))
}

export function periodLabelForWeek(at: Date): string {
  const { start, end } = weekBoundsMondaySunday(at)
  const df = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' })
  const yEnd = end.getFullYear()
  if (start.getFullYear() !== yEnd) {
    const dfy = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${dfy.format(start)} – ${dfy.format(end)}`
  }
  return `${df.format(start)}–${df.format(end)} ${yEnd}`
}
