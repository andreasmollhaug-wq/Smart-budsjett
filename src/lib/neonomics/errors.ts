export type NeonomicsErrorLink = {
  type?: string
  rel?: string
  href?: string
  meta?: { id?: string }
}

export type NeonomicsApiErrorBody = {
  id?: string
  errorCode?: string
  message?: string
  source?: string
  type?: string
  timestamp?: number
  links?: NeonomicsErrorLink[]
}

export class NeonomicsApiError extends Error {
  readonly errorCode: string
  readonly statusCode: number
  readonly consentHref: string | null
  readonly body: NeonomicsApiErrorBody

  constructor(statusCode: number, body: NeonomicsApiErrorBody) {
    super(body.message ?? `Neonomics API-feil (${statusCode})`)
    this.name = 'NeonomicsApiError'
    this.statusCode = statusCode
    this.errorCode = body.errorCode ?? 'unknown'
    this.body = body
    const consent = body.links?.find((l) => l.rel === 'consent')
    this.consentHref = consent?.href ?? null
  }

  get needsConsent(): boolean {
    return this.errorCode === '1426' && !!this.consentHref
  }
}

export function parseNeonomicsErrorBody(text: string): NeonomicsApiErrorBody | null {
  try {
    const o = JSON.parse(text) as unknown
    if (o && typeof o === 'object') return o as NeonomicsApiErrorBody
  } catch {
    /* ignore */
  }
  return null
}
