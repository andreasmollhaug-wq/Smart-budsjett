/** Supabase sender-ofte auth-feil til Site URL med `error`, `error_code`, `error_description` i query og/eller hash. */

const AUTH_ERROR_KEYS = ['error', 'error_code', 'error_description', 'error_hint'] as const

export type SupabaseAuthUrlError = {
  error: string | null
  errorCode: string | null
  errorDescription: string | null
}

function pickParam(search: URLSearchParams, hashParams: URLSearchParams, key: string): string | null {
  return search.get(key) ?? hashParams.get(key)
}

export function readSupabaseAuthErrorFromHref(href: string): SupabaseAuthUrlError | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  const search = url.searchParams
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const hashParams = hash ? new URLSearchParams(hash) : new URLSearchParams()

  const error = pickParam(search, hashParams, 'error')
  const errorCode = pickParam(search, hashParams, 'error_code')
  const errorDescription = pickParam(search, hashParams, 'error_description')

  if (!error && !errorCode && !errorDescription) return null
  return { error, errorCode, errorDescription }
}

export function readSupabaseAuthErrorFromWindow(): SupabaseAuthUrlError | null {
  if (typeof window === 'undefined') return null
  return readSupabaseAuthErrorFromHref(window.location.href)
}

export function decodeSupabaseErrorDescription(raw: string | null): string {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw.replace(/\+/g, ' ')
  }
}

export function stripSupabaseAuthErrorFromUrl(): void {
  if (typeof window === 'undefined') return
  const u = new URL(window.location.href)
  for (const k of AUTH_ERROR_KEYS) {
    u.searchParams.delete(k)
  }
  const hashRaw = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
  if (hashRaw) {
    const params = new URLSearchParams(hashRaw)
    for (const k of AUTH_ERROR_KEYS) {
      params.delete(k)
    }
    const kept = [...params.entries()].filter(([, v]) => v !== '')
    u.hash = kept.length ? `#${new URLSearchParams(kept).toString()}` : ''
  }
  window.history.replaceState({}, '', `${u.pathname}${u.search}${u.hash}`)
}
