/**
 * Server-only: oppdater kurskoblede investeringer (aksjer m.m.) med Finnhub + Frankfurter.
 * Brukes av cron — samme logikk som på Investering-siden, men uten nettleser.
 */

import { fetchFinnhubSnapshot } from '@/lib/finnhubQuotesServer'
import type { Investment, InvestmentHistoryPoint, PersonData, PersistedAppSlice } from '@/lib/store'
import { valueInNok } from '@/lib/fxToNok'
import { generateId } from '@/lib/utils'

export function todayIsoDateOslo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Oslo' })
}

function mergeHistoryToday(
  history: Investment['history'] | undefined,
  today: string,
  valueNok: number,
): Investment['history'] | undefined {
  const hist = history ? [...history] : []
  const idx = hist.findIndex((p) => p.date === today)
  const point: InvestmentHistoryPoint = { id: generateId(), date: today, value: valueNok }
  if (idx >= 0) hist[idx] = point
  else hist.push(point)
  hist.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return hist
}

async function fetchFrankfurterRateToNok(fromCurrency: string): Promise<number> {
  const c = fromCurrency.trim().toUpperCase()
  if (!c || c === 'NOK') return 1
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(c)}&to=NOK`,
    { cache: 'no-store' },
  )
  if (!res.ok) throw new Error('Frankfurter')
  const data = (await res.json()) as { rates?: { NOK?: number } }
  const r = data.rates?.NOK
  if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) throw new Error('Frankfurter')
  return r
}

export type FinnhubSnap = Awaited<ReturnType<typeof fetchFinnhubSnapshot>>

export async function buildGlobalQuoteAndRateCaches(
  symbols: Set<string>,
  finnhubKey: string,
): Promise<{ quoteCache: Map<string, FinnhubSnap>; rateCache: Map<string, number> }> {
  const quoteCache = new Map<string, FinnhubSnap>()
  for (const sym of symbols) {
    const snap = await fetchFinnhubSnapshot(sym, finnhubKey)
    quoteCache.set(sym, snap)
    await new Promise((r) => setTimeout(r, 60))
  }

  const rateCache = new Map<string, number>()
  rateCache.set('NOK', 1)
  const currencies = new Set<string>()
  for (const snap of quoteCache.values()) {
    if (snap.ok) currencies.add(snap.currency?.trim() || 'USD')
  }
  for (const c of currencies) {
    if (c === 'NOK') continue
    try {
      const rate = await fetchFrankfurterRateToNok(c)
      rateCache.set(c, rate)
    } catch {
      rateCache.set(c, 1)
    }
  }

  return { quoteCache, rateCache }
}

export function syncPersonInvestmentsWithCaches(
  person: PersonData,
  quoteCache: Map<string, FinnhubSnap>,
  rateCache: Map<string, number>,
): PersonData {
  const today = todayIsoDateOslo()
  return {
    ...person,
    investments: person.investments.map((inv) => {
      if (!inv.quoteSymbol || inv.shares == null || inv.shares <= 0) return inv
      const sym = inv.quoteSymbol.trim()
      const snap = quoteCache.get(sym)
      if (!snap || !snap.ok) return inv
      const price = snap.regularMarketPrice
      if (price == null || !Number.isFinite(price) || price <= 0) return inv
      const cur = snap.currency?.trim() || 'USD'
      const rate = rateCache.get(cur) ?? 1
      const valNok = valueInNok(inv.shares * price, cur, rate)
      const history = mergeHistoryToday(inv.history, today, valNok)
      return { ...inv, currentValue: valNok, quoteCurrency: cur, history }
    }),
  }
}

export function collectTrackedSymbolsFromSlice(slice: PersistedAppSlice): Set<string> {
  const symbols = new Set<string>()
  for (const pid of Object.keys(slice.people ?? {})) {
    const p = slice.people[pid]
    if (!p) continue
    for (const inv of p.investments ?? []) {
      if (inv.quoteSymbol && inv.shares != null && inv.shares > 0) {
        symbols.add(inv.quoteSymbol.trim())
      }
    }
  }
  return symbols
}

export function syncPersistedSliceWithCaches(
  slice: PersistedAppSlice,
  quoteCache: Map<string, FinnhubSnap>,
  rateCache: Map<string, number>,
): PersistedAppSlice {
  const people = { ...slice.people }
  for (const pid of Object.keys(people)) {
    const p = people[pid]
    if (!p) continue
    people[pid] = syncPersonInvestmentsWithCaches(p, quoteCache, rateCache)
  }
  return { ...slice, people }
}
