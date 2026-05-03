/** Nettleser-cookie: sist valgte SmartVane-måned (synker Måned ↔ Innsikt uten query). */
export const SMARTVANE_YM_COOKIE = 'sb_smartvane_ym'

const Y_RANGE = { min: 2000, max: 2100 } as const

export type SmartvaneYm = { year: number; month: number }

export function parseYmFromQuery(yRaw: string | null, mRaw: string | null): SmartvaneYm | null {
  if (yRaw == null || yRaw === '' || mRaw == null || mRaw === '') return null
  const year = parseInt(yRaw, 10)
  const month = parseInt(mRaw, 10)
  if (
    Number.isNaN(year) ||
    year < Y_RANGE.min ||
    year > Y_RANGE.max ||
    Number.isNaN(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }
  return { year, month }
}

export function parseYmCookie(raw: string | undefined | null): SmartvaneYm | null {
  if (raw == null || raw === '') return null
  const m = /^(\d{4})-(\d{1,2})$/.exec(raw.trim())
  if (!m) return null
  const year = parseInt(m[1]!, 10)
  const month = parseInt(m[2]!, 10)
  if (
    Number.isNaN(year) ||
    year < Y_RANGE.min ||
    year > Y_RANGE.max ||
    Number.isNaN(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }
  return { year, month }
}

export function serializeYmCookie({ year, month }: SmartvaneYm): string {
  return `${year}-${month}`
}

export const smartvaneYmCookieOptions = {
  path: '/' as const,
  maxAge: 60 * 60 * 24 * 400,
  sameSite: 'lax' as const,
  /** Unngå at nettleseren blokkerer i typisk same-site Next.js-oppsett (dev/prod). */
  secure: process.env.NODE_ENV === 'production',
}
