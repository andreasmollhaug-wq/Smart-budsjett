import { getNeonomicsConfig } from '@/lib/neonomics/config'

type TokenCache = {
  accessToken: string
  expiresAtMs: number
  refreshToken: string | null
}

let cache: TokenCache | null = null

type TokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
}

async function fetchToken(body: URLSearchParams): Promise<TokenResponse> {
  const { tokenUrl } = getNeonomicsConfig()
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Neonomics token (${res.status}): ${text.slice(0, 200)}`)
  }
  return JSON.parse(text) as TokenResponse
}

/** In-memory cached access token (per server instance). */
export async function getNeonomicsAccessToken(): Promise<string> {
  const now = Date.now()
  if (cache && cache.expiresAtMs > now + 30_000) {
    return cache.accessToken
  }
  const { clientId, clientSecret } = getNeonomicsConfig()
  if (cache?.refreshToken) {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: cache.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      })
      const data = await fetchToken(body)
      cache = {
        accessToken: data.access_token,
        expiresAtMs: now + data.expires_in * 1000,
        refreshToken: data.refresh_token ?? cache.refreshToken,
      }
      return cache.accessToken
    } catch {
      cache = null
    }
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const data = await fetchToken(body)
  cache = {
    accessToken: data.access_token,
    expiresAtMs: now + data.expires_in * 1000,
    refreshToken: data.refresh_token ?? null,
  }
  return cache.accessToken
}

export function clearNeonomicsTokenCache(): void {
  cache = null
}
