/** Europe/Oslo civil calendar helpers for Stripe trial_end (Unix seconds). */

const EUROPE_OSLO = 'Europe/Oslo'

function slotInTimeZone(timeZone: string, utcMs: number) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
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
  return {
    y: o.year,
    m: o.month,
    d: o.day,
    h: o.hour,
    mi: o.minute,
    s: o.second,
  }
}

function civilCompare(
  y1: number,
  m1: number,
  d1: number,
  y2: number,
  m2: number,
  d2: number
): number {
  if (y1 !== y2) return y1 - y2
  if (m1 !== m2) return m1 - m2
  return d1 - d2
}

/** UTC ms for 00:00:00.000 on the given Y-M-D civil date i `timeZone`. */
export function startOfZonedDayUtcMs(timeZone: string, year: number, month: number, day: number): number {
  const dayCmp = (utcMs: number) => {
    const { y, m, d } = slotInTimeZone(timeZone, utcMs)
    return civilCompare(y, m, d, year, month, day)
  }

  let lo = Date.UTC(year, month - 1, day - 1, 8, 0, 0)
  let hi = Date.UTC(year, month - 1, day + 1, 8, 0, 0)
  while (dayCmp(lo) >= 0) lo -= 86400000
  while (dayCmp(hi) < 0) hi += 86400000

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (dayCmp(mid) >= 0) hi = mid
    else lo = mid
  }

  const verify = slotInTimeZone(timeZone, hi)
  if (
    verify.y === year &&
    verify.m === month &&
    verify.d === day &&
    verify.h === 0 &&
    verify.mi === 0 &&
    verify.s === 0
  ) {
    return hi
  }

  for (let t = hi - 3600000; t <= hi + 7200000; t += 1000) {
    const s = slotInTimeZone(timeZone, t)
    if (
      s.y === year &&
      s.m === month &&
      s.d === day &&
      s.h === 0 &&
      s.mi === 0 &&
      s.s === 0
    ) {
      return t
    }
  }
  throw new Error(`startOfZonedDayUtcMs: ingen midnatt for ${year}-${month}-${day} i ${timeZone}`)
}

/**
 * Siste inkluderte kalenderdag i Oslo (`dateOnly` = YYYY-MM-DD): prøven slutter ved
 * første øyeblikk av neste lokale dag (tilsvarende «gratis ut den dagen»).
 */
export function exclusiveEndOfOsloYmdAsUnixSeconds(dateOnly: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const nextUtc = new Date(Date.UTC(y, mo - 1, d + 1))
  const ny = nextUtc.getUTCFullYear()
  const nm = nextUtc.getUTCMonth() + 1
  const nd = nextUtc.getUTCDate()
  const startNext = startOfZonedDayUtcMs(EUROPE_OSLO, ny, nm, nd)
  return Math.floor(startNext / 1000)
}
