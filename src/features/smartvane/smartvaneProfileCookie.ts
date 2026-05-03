/** Synker aktiv budsjettprofil for SmartVane RSC/server actions (samme ID-er som Zustand). */
export const SMARTVANE_PROFILE_COOKIE = 'sb_smartvane_profile'

export const DEFAULT_SMARTVANE_PROFILE_ID = 'default' as const

const MAX_LEN = 64

/** Tillatte tegn: alfanumerisk, `_`, `-` (dekker `default` og `generateId()` fra appen). */
const PROFILE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/

export function sanitizeSmartvaneProfileId(raw: string | null | undefined): string {
  if (raw == null) return DEFAULT_SMARTVANE_PROFILE_ID
  const t = typeof raw === 'string' ? raw.trim() : String(raw).trim()
  if (t.length === 0 || t.length > MAX_LEN) return DEFAULT_SMARTVANE_PROFILE_ID
  if (!PROFILE_ID_RE.test(t)) return DEFAULT_SMARTVANE_PROFILE_ID
  return t
}

export function parseSmartvaneProfileCookie(encoded: string | undefined | null): string {
  if (encoded == null || encoded === '') return DEFAULT_SMARTVANE_PROFILE_ID
  try {
    return sanitizeSmartvaneProfileId(decodeURIComponent(encoded))
  } catch {
    return sanitizeSmartvaneProfileId(encoded)
  }
}

export const smartvaneProfileCookieOptions = {
  path: '/' as const,
  maxAge: 60 * 60 * 24 * 400,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

function cookieAttrSegment(): string {
  const { path, maxAge, sameSite, secure } = smartvaneProfileCookieOptions
  const secureFlag = secure ? '; Secure' : ''
  return `; path=${path}; max-age=${maxAge}; SameSite=${sameSite}${secureFlag}`
}

/** Les rå cookie-verdi (før sanitizing) fra document — kun klient. */
export function readRawSmartvaneProfileCookieClient(): string | null {
  if (typeof document === 'undefined') return null
  const parts = `; ${document.cookie}`.split(`; ${SMARTVANE_PROFILE_COOKIE}=`)
  if (parts.length < 2) return null
  return parts.pop()!.split(';').shift() ?? null
}

/** Klient: skriv cookie slik at neste SSR for SmartVane bruker riktig profil. */
export function writeSmartvaneProfileCookieClient(profileId: string): void {
  if (typeof document === 'undefined') return
  const id = sanitizeSmartvaneProfileId(profileId)
  document.cookie = `${SMARTVANE_PROFILE_COOKIE}=${encodeURIComponent(id)}${cookieAttrSegment()}`
}
