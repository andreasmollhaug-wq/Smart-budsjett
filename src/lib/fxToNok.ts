/**
 * Valutakurs til NOK via egen API-rute (Frankfurter på serveren) — unngår direkte kall fra
 * nettleseren til frankfurter.app som ofte gir «Failed to fetch» (nettverk, blokkering, CORS).
 */

export async function fetchRateToNok(fromCurrency: string): Promise<number> {
  const c = fromCurrency?.trim().toUpperCase()
  if (!c || c === 'NOK') return 1

  const res = await fetch(`/api/fx?from=${encodeURIComponent(c)}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  const body = (await res.json().catch(() => null)) as
    | { rateToNok?: number; error?: string }
    | null

  if (!res.ok) {
    const msg =
      body && typeof body.error === 'string'
        ? body.error
        : res.status === 401
          ? 'Du må være innlogget.'
          : 'Kunne ikke hente valutakurs.'
    throw new Error(msg)
  }

  if (typeof body?.rateToNok !== 'number' || !Number.isFinite(body.rateToNok) || body.rateToNok <= 0) {
    throw new Error('Ugyldig svar fra serveren (valuta).')
  }

  return body.rateToNok
}

export function valueInNok(localAmount: number, fromCurrency: string, rateToNok: number): number {
  const c = fromCurrency?.trim().toUpperCase()
  if (!c || c === 'NOK') return Math.round(localAmount)
  return Math.round(localAmount * rateToNok)
}
