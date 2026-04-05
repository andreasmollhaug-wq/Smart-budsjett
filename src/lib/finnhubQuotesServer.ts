/**
 * Server-only: Finnhub quote + profile (https://finnhub.io).
 * Oslo: bruk f.eks. EQNR.OSE eller ticker fra Finnhub (ikke Yahoo-suffiks .OL).
 */

export type FinnhubQuoteRow = {
  ok: true
  symbol: string
  shortName: string
  currency: string
  regularMarketPrice: number | null
  regularMarketChange: number | null
  regularMarketChangePercent: number | null
  marketState: string
  exchange: string
}

export type FinnhubQuoteErr = {
  ok: false
  symbol: string
  error: string
}

/**
 * Yahoo .OL → .OSE; prøv også «bar» ticker (EQNR) — Finnhub gratis gir ofte tom 200 for OSE
 * og 403 for .OL, mens US-notering (EQNR) har faktisk kurs.
 */
export function finnhubSymbolVariants(userSymbol: string): string[] {
  const s = userSymbol.trim()
  if (!s) return []
  const list: string[] = []

  const baseFromDotted =
    s.includes('.') && /^[A-Za-z0-9-]+\.[A-Za-z0-9-]+$/i.test(s) ? s.split('.')[0]!.trim().toUpperCase() : null

  if (/\.OL$/i.test(s)) {
    list.push(s.replace(/\.OL$/i, '.OSE'))
    if (baseFromDotted) list.push(baseFromDotted)
    list.push(s)
  } else if (/\.OSE$/i.test(s)) {
    list.push(s)
    if (baseFromDotted) list.push(baseFromDotted)
    list.push(s.replace(/\.OSE$/i, '.OL'))
  } else {
    list.push(s)
  }

  return [...new Set(list)]
}

/** Finnhub /search — finn ticker fra navn (f.eks. «equinor» → EQNR.OSE) */
async function searchFinnhubSymbol(query: string, token: string): Promise<string | null> {
  const q = query.trim()
  if (q.length < 2) return null
  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${encodeURIComponent(token)}`
  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch {
    return null
  }
  if (!res.ok) return null
  const data = (await res.json().catch(() => null)) as { result?: unknown } | null
  const rows = data?.result
  if (!Array.isArray(rows) || rows.length === 0) return null

  type Row = { symbol?: string; type?: string; displaySymbol?: string }
  const list = rows as Row[]
  const prefer = (r: Row) =>
    r.type === 'Common Stock' || r.type === 'ADR' || r.type === 'ETF' || r.type === 'ETP' || r.type === 'Closed-End Fund'
  const pick = list.find(prefer) ?? list[0]
  const sym = pick?.symbol ?? pick?.displaySymbol
  return typeof sym === 'string' && sym.length > 0 ? sym : null
}

function isUsableQuote(
  quote: { c?: unknown; pc?: unknown; t?: unknown },
  profile: { name?: unknown } | null,
): boolean {
  if (typeof profile?.name === 'string' && profile.name.length > 0) return true
  if (typeof quote.c === 'number' && Number.isFinite(quote.c) && quote.c > 0) return true
  if (
    typeof quote.c === 'number' &&
    Number.isFinite(quote.c) &&
    typeof quote.pc === 'number' &&
    Number.isFinite(quote.pc) &&
    quote.pc !== 0
  ) {
    return true
  }
  if (typeof quote.t === 'number' && quote.t > 0 && typeof quote.c === 'number' && Number.isFinite(quote.c)) {
    return true
  }
  return false
}

export async function fetchFinnhubSnapshot(
  userSymbol: string,
  token: string,
  options: { allowSearchFallback?: boolean } = {},
): Promise<FinnhubQuoteRow | FinnhubQuoteErr> {
  const allowSearchFallback = options.allowSearchFallback !== false

  const variants = finnhubSymbolVariants(userSymbol)
  if (variants.length === 0) {
    return { ok: false, symbol: userSymbol, error: 'Tomt symbol.' }
  }

  let lastError = 'Fant ikke kurs for symbolet.'

  for (const sym of variants) {
    const qUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${encodeURIComponent(token)}`
    const pUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${encodeURIComponent(token)}`

    let qRes: Response
    let pRes: Response
    try {
      ;[qRes, pRes] = await Promise.all([
        fetch(qUrl, { cache: 'no-store' }),
        fetch(pUrl, { cache: 'no-store' }),
      ])
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Nettverksfeil.'
      continue
    }

    if (qRes.status === 429 || pRes.status === 429) {
      return {
        ok: false,
        symbol: userSymbol,
        error: 'For mange forespørsler mot kursleverandør. Prøv igjen om et øyeblikk.',
      }
    }

    if (!qRes.ok) {
      // 403 kan være ugyldig symbol/format hos Finnhub — prøv neste variant (f.eks. .OSE etter .OL).
      if (qRes.status === 403) {
        lastError = 'Fant ikke kurs for denne ticker-varianten (403).'
      } else {
        lastError = `Kursleverandør svarte med ${qRes.status}.`
      }
      continue
    }

    const quote = (await qRes.json().catch(() => null)) as Record<string, unknown> | null
    const profile = pRes.ok
      ? ((await pRes.json().catch(() => null)) as Record<string, unknown> | null)
      : null

    if (quote && typeof quote.error === 'string') {
      lastError = quote.error
      continue
    }
    if (!quote) {
      continue
    }

    if (!isUsableQuote(quote as { c?: unknown; pc?: unknown; t?: unknown }, profile)) {
      continue
    }

    const c = quote.c
    const d = quote.d
    const dp = quote.dp
    const shortName =
      (typeof profile?.name === 'string' && profile.name) ||
      (typeof profile?.ticker === 'string' && profile.ticker) ||
      sym
    const currency = typeof profile?.currency === 'string' ? profile.currency : ''
    const exchange = typeof profile?.exchange === 'string' ? profile.exchange : ''

    return {
      ok: true,
      symbol: typeof profile?.ticker === 'string' ? profile.ticker : sym,
      shortName,
      currency,
      regularMarketPrice: typeof c === 'number' && Number.isFinite(c) ? c : null,
      regularMarketChange: typeof d === 'number' && Number.isFinite(d) ? d : null,
      regularMarketChangePercent: typeof dp === 'number' && Number.isFinite(dp) ? dp : null,
      marketState: '—',
      exchange,
    }
  }

  if (allowSearchFallback) {
    const resolved = await searchFinnhubSymbol(userSymbol, token)
    if (
      resolved &&
      resolved.trim().toUpperCase() !== userSymbol.trim().toUpperCase() &&
      !variants.some((v) => v.toUpperCase() === resolved.toUpperCase())
    ) {
      const second = await fetchFinnhubSnapshot(resolved, token, { allowSearchFallback: false })
      if (second.ok) return second
      if (!second.ok) {
        return { ok: false, symbol: userSymbol, error: second.error }
      }
    }
  }

  return { ok: false, symbol: userSymbol, error: lastError }
}
