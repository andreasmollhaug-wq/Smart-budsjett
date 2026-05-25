import { getNeonomicsAccessToken } from '@/lib/neonomics/token'
import { getNeonomicsConfig } from '@/lib/neonomics/config'
import { NeonomicsApiError, parseNeonomicsErrorBody } from '@/lib/neonomics/errors'

export type NeonomicsRequestContext = {
  deviceId: string
  sessionId?: string
  psuIp?: string
  psuId?: string
}

export async function neonomicsFetch(
  path: string,
  ctx: NeonomicsRequestContext,
  init?: RequestInit & { searchParams?: Record<string, string | undefined> },
): Promise<Response> {
  const { baseUrl } = getNeonomicsConfig()
  const token = await getNeonomicsAccessToken()
  const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`)
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      if (v != null && v !== '') url.searchParams.set(k, v)
    }
  }
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')
  headers.set('x-device-id', ctx.deviceId)
  if (ctx.sessionId) headers.set('x-session-id', ctx.sessionId)
  if (ctx.psuIp) headers.set('x-psu-ip-address', ctx.psuIp)
  if (ctx.psuId) headers.set('x-psu-id', ctx.psuId)

  const { searchParams: _sp, ...rest } = init ?? {}
  return fetch(url.toString(), { ...rest, headers })
}

export async function neonomicsJson<T>(
  path: string,
  ctx: NeonomicsRequestContext,
  init?: RequestInit & { searchParams?: Record<string, string | undefined> },
): Promise<T> {
  const res = await neonomicsFetch(path, ctx, init)
  const text = await res.text()
  if (!res.ok) {
    const body = parseNeonomicsErrorBody(text) ?? { message: text }
    throw new NeonomicsApiError(res.status, body)
  }
  if (!text) return {} as T
  return JSON.parse(text) as T
}
