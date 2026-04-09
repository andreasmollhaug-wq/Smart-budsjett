import type { Transaction } from '@/lib/store'

/** Periodevalg som matcher transaksjonsfiltre (måned 0–11, hele året, eller hittil i år). */
export type TransactionPeriodMode = number | 'all' | 'ytd'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Enkel validering av ISO-dato (yyyy-mm-dd). */
export function isIsoDateString(d: string): boolean {
  if (!ISO_DATE.test(d)) return false
  const t = Date.parse(`${d}T12:00:00`)
  return Number.isFinite(t)
}

/** Dagens dato som ISO-streng i lokal tidssone (for YTD-slutt og KPI-filtrering). */
export function todayIsoLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * YTD-intervall for et gitt år, gitt «i dag» (typisk `todayIsoLocal()`).
 * `null` når hele budsjettåret ligger i fremtiden (ingen treff).
 */
export function ytdRangeIso(filterYear: number, todayIso: string): { start: string; end: string } | null {
  const start = `${filterYear}-01-01`
  const yearEnd = `${filterYear}-12-31`
  if (!isIsoDateString(todayIso)) return null
  if (todayIso < start) return null
  if (todayIso > yearEnd) return { start, end: yearEnd }
  return { start, end: todayIso }
}

/**
 * Om transaksjonen faller innenfor valgt periode.
 * @param todayIsoOverride — kun for tester; default er `todayIsoLocal()`.
 */
export function transactionInPeriod(
  t: Transaction,
  mode: TransactionPeriodMode,
  filterYear: number,
  todayIsoOverride?: string,
): boolean {
  const d = t.date
  if (typeof d !== 'string' || !isIsoDateString(d)) return false

  if (mode === 'all') {
    return d.startsWith(`${filterYear}-`)
  }

  if (typeof mode === 'number') {
    const mm = String(mode + 1).padStart(2, '0')
    return d.startsWith(`${filterYear}-${mm}-`)
  }

  if (mode === 'ytd') {
    const todayIso = todayIsoOverride ?? todayIsoLocal()
    const range = ytdRangeIso(filterYear, todayIso)
    if (!range) return false
    return d >= range.start && d <= range.end
  }

  return false
}

/** Transaksjoner med gyldig dato som skal telle i KPI-kort (til og med i dag). */
export function transactionOnOrBeforeToday(t: Transaction, todayIsoOverride?: string): boolean {
  const d = t.date
  if (typeof d !== 'string' || !isIsoDateString(d)) return false
  const todayIso = todayIsoOverride ?? todayIsoLocal()
  return d <= todayIso
}
