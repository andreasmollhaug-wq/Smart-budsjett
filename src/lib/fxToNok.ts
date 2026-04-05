/**
 * Konverterer beløp i gitt valuta til NOK via Frankfurter (ECB-baserte kurser, gratis).
 */

export async function fetchRateToNok(fromCurrency: string): Promise<number> {
  const c = fromCurrency?.trim().toUpperCase()
  if (!c || c === 'NOK') return 1

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(c)}&to=NOK`,
    { credentials: 'omit' },
  )
  if (!res.ok) {
    throw new Error('Kunne ikke hente valutakurs.')
  }
  const data = (await res.json().catch(() => null)) as { rates?: { NOK?: number } } | null
  const r = data?.rates?.NOK
  if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) {
    throw new Error(`Ingen kurs til NOK for ${c}.`)
  }
  return r
}

export function valueInNok(localAmount: number, fromCurrency: string, rateToNok: number): number {
  const c = fromCurrency?.trim().toUpperCase()
  if (!c || c === 'NOK') return Math.round(localAmount)
  return Math.round(localAmount * rateToNok)
}
