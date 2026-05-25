import { neonomicsJson } from '@/lib/neonomics/client'
import type { NeonomicsRequestContext } from '@/lib/neonomics/client'
import type { NeonomicsApiErrorBody } from '@/lib/neonomics/errors'

type ConsentResponse = {
  message?: string
  links?: { href?: string; rel?: string }[]
}

/** GET consent URL from 1426 error href, returns bank authentication URL. */
export async function fetchConsentBankUrl(
  consentHref: string,
  ctx: NeonomicsRequestContext,
  redirectUrl?: string,
): Promise<string> {
  const headers: Record<string, string> = {}
  if (redirectUrl) headers['x-redirect-url'] = redirectUrl
  const data = await neonomicsJson<ConsentResponse>(consentHref, ctx, {
    method: 'GET',
    headers,
  })
  const bankUrl = data.links?.[0]?.href
  if (!bankUrl) throw new Error('Consent-svar mangler bank-URL')
  return bankUrl
}

export function consentHrefFromErrorBody(body: NeonomicsApiErrorBody): string | null {
  return body.links?.find((l) => l.rel === 'consent')?.href ?? null
}
