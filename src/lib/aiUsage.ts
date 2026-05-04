/** Månedlig AI-meldingsgrense (server). Overstyr med AI_MONTHLY_MESSAGE_LIMIT. */
export const AI_MONTHLY_LIMIT_DEFAULT = 100

/** Kjøpt ekstra-pakke (Stripe) — antall meldinger og visningspris (NOK). */
export const AI_BONUS_PACK_CREDITS_DEFAULT = 100
export const AI_BONUS_PACK_PRICE_NOK_DEFAULT = 29

export function getBonusPackCredits(): number {
  const raw = process.env.AI_BONUS_PACK_CREDITS
  if (raw === undefined || raw === '') return AI_BONUS_PACK_CREDITS_DEFAULT
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : AI_BONUS_PACK_CREDITS_DEFAULT
}

/** Pris vist i UI (NEXT_PUBLIC_AI_BONUS_PRICE_NOK). */
export function getBonusPackPriceNok(): number {
  const raw = process.env.NEXT_PUBLIC_AI_BONUS_PRICE_NOK
  if (raw === undefined || raw === '') return AI_BONUS_PACK_PRICE_NOK_DEFAULT
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : AI_BONUS_PACK_PRICE_NOK_DEFAULT
}

export function getMonthlyMessageLimit(): number {
  const raw = process.env.AI_MONTHLY_MESSAGE_LIMIT
  if (raw === undefined || raw === '') return AI_MONTHLY_LIMIT_DEFAULT
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : AI_MONTHLY_LIMIT_DEFAULT
}

/** Halvveis-informasjon: 50 % av gjeldende grense (avrundet ned). */
export function getUsageInfoThreshold(limit: number): number {
  return Math.max(0, Math.floor(limit / 2))
}

export function shouldShowHalfUsageInfo(used: number, limit: number): boolean {
  const t = getUsageInfoThreshold(limit)
  return used >= t && used < limit
}

/** Nåværende YYYY-MM i Europe/Oslo (matcher DB). */
export function currentYearMonthOslo(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
  })
  const parts = fmt.formatToParts(now)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  if (!y || !m) {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  return `${y}-${m}`
}

/** Kalenderår og måned (1–12) i Europe/Oslo — samme logikk som `currentYearMonthOslo` (f.eks. SmartVane redirect). */
export function currentCalendarYearMonthOslo(now: Date = new Date()): { year: number; month: number } {
  const ym = currentYearMonthOslo(now)
  const [yStr, mStr] = ym.split('-')
  const year = Number.parseInt(yStr ?? '', 10)
  const month = Number.parseInt(mStr ?? '', 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  }
  return { year, month }
}
