import { startOfZonedDayUtcMs } from '@/lib/stripe/osloZonedTime'

export const ADMIN_METRICS_TIMEZONE = 'Europe/Oslo' as const

const TZ = ADMIN_METRICS_TIMEZONE

function slotInTimeZone(utcMs: number) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  })
  const parts = dtf.formatToParts(new Date(utcMs))
  const o: Record<string, number> = {}
  for (const { type, value } of parts) {
    if (type !== 'literal') o[type] = Number(value)
  }
  return { year: o.year, month: o.month, day: o.day }
}

export function zonedTodayParts(nowMs: number = Date.now()) {
  return slotInTimeZone(nowMs)
}

export function zonedDayRangeUtcMs(year: number, month: number, day: number) {
  const startMs = startOfZonedDayUtcMs(TZ, year, month, day)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  const endMsExclusive = startOfZonedDayUtcMs(
    TZ,
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
  )
  return { startMs, endMsExclusive }
}

function addCalendarDays(year: number, month: number, day: number, deltaDays: number) {
  const d = new Date(Date.UTC(year, month - 1, day + deltaDays))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

export function recentCalendarDayRangesUtcMs(
  nowMs: number,
  dayCount: number,
): Array<{
  dateKey: string
  dayLabel: string
  startMs: number
  endMsExclusive: number
  isToday: boolean
}> {
  const { year, month, day } = zonedTodayParts(nowMs)
  const out: Array<{
    dateKey: string
    dayLabel: string
    startMs: number
    endMsExclusive: number
    isToday: boolean
  }> = []

  for (let offset = dayCount - 1; offset >= 0; offset--) {
    const parts = addCalendarDays(year, month, day, -offset)
    const { startMs, endMsExclusive: dayEnd } = zonedDayRangeUtcMs(parts.year, parts.month, parts.day)
    const isToday = offset === 0
    const dateKey = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
    const dayLabel = new Intl.DateTimeFormat('nb-NO', {
      timeZone: TZ,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(startMs))

    out.push({
      dateKey,
      dayLabel,
      startMs,
      endMsExclusive: isToday ? nowMs + 1 : dayEnd,
      isToday,
    })
  }

  return out.reverse()
}

export function yesterdayRangeUtcMs(nowMs: number = Date.now()) {
  const { year, month, day } = zonedTodayParts(nowMs)
  const y = addCalendarDays(year, month, day, -1)
  return zonedDayRangeUtcMs(y.year, y.month, y.day)
}

/** I dag hittil (midnatt Oslo → nå). */
export function todaySoFarRangeUtcMs(nowMs: number = Date.now()) {
  const { year, month, day } = zonedTodayParts(nowMs)
  const { startMs } = zonedDayRangeUtcMs(year, month, day)
  return { startMs, endMsExclusive: nowMs + 1 }
}

export function dayBeforeYesterdayRangeUtcMs(nowMs: number = Date.now()) {
  const { year, month, day } = zonedTodayParts(nowMs)
  const y = addCalendarDays(year, month, day, -2)
  return zonedDayRangeUtcMs(y.year, y.month, y.day)
}

export function isTimestampInRange(
  iso: string | null | undefined,
  startMs: number,
  endMsExclusive: number,
): boolean {
  if (!iso) return false
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return false
  return ms >= startMs && ms < endMsExclusive
}

/** Mandag 00:00 Oslo for uken som inneholder (year, month, day). */
export function isoWeekStartUtcMs(year: number, month: number, day: number): number {
  const noonUtc = Date.UTC(year, month - 1, day, 12, 0, 0)
  const { year: y, month: m, day: d } = slotInTimeZone(noonUtc)
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(
    new Date(noonUtc),
  )
  const dayIndex: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  const offset = dayIndex[weekday] ?? 0
  const monday = addCalendarDays(y, m, d, -offset)
  return startOfZonedDayUtcMs(TZ, monday.year, monday.month, monday.day)
}

export function formatWeekLabel(weekStartMs: number): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(weekStartMs))
}

export function formatOsloDateTime(nowMs: number = Date.now()): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(nowMs))
}

export function formatOsloDayLabel(year: number, month: number, day: number): string {
  const { startMs } = zonedDayRangeUtcMs(year, month, day)
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(startMs))
}

/** Siste `weekCount` uker inkl. inneværende uke (mandag-start Oslo). */
export function recentWeekStartsUtcMs(nowMs: number, weekCount: number): number[] {
  const today = zonedTodayParts(nowMs)
  const currentWeekStart = isoWeekStartUtcMs(today.year, today.month, today.day)
  const out: number[] = []
  for (let i = weekCount - 1; i >= 0; i--) {
    const parts = slotInTimeZone(currentWeekStart - i * 7 * 86400000)
    out.push(isoWeekStartUtcMs(parts.year, parts.month, parts.day))
  }
  return out
}

export function weekRangeUtcMs(weekStartMs: number) {
  const parts = slotInTimeZone(weekStartMs)
  const startMs = startOfZonedDayUtcMs(TZ, parts.year, parts.month, parts.day)
  const endMsExclusive = startMs + 7 * 86400000
  return { startMs, endMsExclusive }
}
