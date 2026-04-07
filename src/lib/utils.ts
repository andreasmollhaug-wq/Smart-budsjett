export function formatNOK(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Heltall med tusenskille (nb-NO), uten valutasymbol — til beløpsfelt. */
export function formatIntegerNbNo(amount: number): string {
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount))
}

/**
 * Tolker streng fra beløpsfelt (tusenskille, mellomrom).
 * Returnerer NaN hvis tomt, ikke-positivt, eller ugyldig.
 */
export function parseIntegerNbNo(s: string): number {
  const cleaned = s.replace(/\s/g, '').replace(/\u00a0/g, '')
  if (!cleaned) return NaN
  const digits = cleaned.replace(/[^0-9]/g, '')
  if (!digits) return NaN
  const n = parseInt(digits, 10)
  if (!Number.isFinite(n) || n <= 0) return NaN
  return n
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** Avvik som andel av budsjett (for avvikskolonne); null når budsjett er 0. */
export function variancePercentOfBudget(variance: number, budgeted: number): number | null {
  if (budgeted === 0) return null
  return (variance / budgeted) * 100
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function calcProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min((current / target) * 100, 100)
}

/** Lys bane for fremdriftsring: blander hex med hvitt (0 = ren farge, 1 = hvitt). */
export function mixHexWithWhite(hex: string, whiteBlend: number): string {
  const n = hex.replace('#', '').trim()
  if (n.length !== 6 || !/^[0-9a-fA-F]+$/.test(n)) return '#E8EAEF'
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  const t = Math.min(1, Math.max(0, whiteBlend))
  const rr = Math.round(r + (255 - r) * t)
  const gg = Math.round(g + (255 - g) * t)
  const bb = Math.round(b + (255 - b) * t)
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`
}

/** Mørkere tone for fremdriftsfyll: blander hex mot svart (0 = ren farge, 1 = svart). */
export function mixHexWithBlack(hex: string, blackBlend: number): string {
  const n = hex.replace('#', '').trim()
  if (n.length !== 6 || !/^[0-9a-fA-F]+$/.test(n)) return '#2E3440'
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  const t = Math.min(1, Math.max(0, blackBlend))
  const rr = Math.round(r * (1 - t))
  const gg = Math.round(g * (1 - t))
  const bb = Math.round(b * (1 - t))
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`
}

export function toMonthly(
  amount: number,
  frequency: 'monthly' | 'yearly' | 'quarterly' | 'weekly' | 'once',
): number {
  if (frequency === 'yearly') return amount / 12
  if (frequency === 'quarterly') return amount / 3
  if (frequency === 'weekly') return amount * 4.33
  return amount // monthly + once
}

export function formatThousands(value: number | string): string {
  const num = String(value).replace(/\D/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('nb-NO')
}

export function parseThousands(formatted: string): number {
  const cleaned = formatted
    .replace(/\s/g, '')
    .replace(/\u00a0/g, '')
    .replace(/\u202f/g, '')
    .replace(/,/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

/** Viser ISO-dato (yyyy-mm-dd) som lesbar norsk dato (dag, måned, år). */
export function formatTransactionDateNbNo(isoDate: string): string {
  if (!isoDate || typeof isoDate !== 'string') return ''
  const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** ISO yyyy-mm-dd → dd.mm.yyyy (lister, kort visning). */
export function formatIsoDateDdMmYyyy(isoDate: string): string {
  if (!isoDate || typeof isoDate !== 'string') return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim())
  if (!m) return isoDate
  return `${m[3]}.${m[2]}.${m[1]}`
}

/** Antall dager i måneden (monthIndex 0 = januar). */
export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

/** ISO-dato (yyyy-mm-dd) for gitt år/måned, med dag klippet til gyldig dag i måneden. */
export function dateInMonth(year: number, monthIndex0: number, dayOfMonth: number): string {
  const dim = daysInMonth(year, monthIndex0)
  const d = Math.min(Math.max(1, Math.floor(dayOfMonth)), dim)
  const m = String(monthIndex0 + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${year}-${m}-${dd}`
}
