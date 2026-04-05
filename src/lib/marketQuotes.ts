export type QuoteSnapshotOk = {
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

export type QuoteSnapshotErr = {
  ok: false
  symbol: string
  error: string
}

export type QuoteSnapshot = QuoteSnapshotOk | QuoteSnapshotErr

export type QuoteApiResponse = {
  results: QuoteSnapshot[]
}

export type QuoteApiErrorBody = {
  error: string
}

export type QuoteSearchHit = {
  description: string
  symbol: string
  displaySymbol?: string
  type: string
}

export type QuoteSearchApiResponse = {
  results: QuoteSearchHit[]
}

export async function fetchQuoteSearch(query: string): Promise<QuoteSearchApiResponse> {
  const q = query.trim()
  if (q.length < 2) {
    return { results: [] }
  }

  const params = new URLSearchParams()
  params.set('q', q)

  const res = await fetch(`/api/quote/search?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  const body = (await res.json().catch(() => null)) as QuoteSearchApiResponse | QuoteApiErrorBody | null

  if (!res.ok) {
    const msg =
      body && 'error' in body && typeof body.error === 'string'
        ? body.error
        : res.status === 401
          ? 'Du må være innlogget.'
          : res.status === 503
            ? 'Kursdata er ikke konfigurert på serveren (FINNHUB_API_KEY).'
            : 'Kunne ikke søke.'
    throw new Error(msg)
  }

  if (!body || !('results' in body) || !Array.isArray(body.results)) {
    throw new Error('Ugyldig svar fra serveren.')
  }

  return body as QuoteSearchApiResponse
}

export async function fetchQuoteSnapshots(symbols: string[]): Promise<QuoteApiResponse> {
  const list = symbols.map((s) => s.trim()).filter(Boolean)
  if (list.length === 0) {
    return { results: [] }
  }

  const params = new URLSearchParams()
  params.set('symbols', list.join(','))

  const res = await fetch(`/api/quote?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  const body = (await res.json().catch(() => null)) as QuoteApiResponse | QuoteApiErrorBody | null

  if (!res.ok) {
    const msg =
      body && 'error' in body && typeof body.error === 'string'
        ? body.error
        : res.status === 401
          ? 'Du må være innlogget.'
          : res.status === 503
            ? 'Kursdata er ikke konfigurert på serveren (FINNHUB_API_KEY).'
            : 'Kunne ikke hente kurs.'
    throw new Error(msg)
  }

  if (!body || !('results' in body) || !Array.isArray(body.results)) {
    throw new Error('Ugyldig svar fra serveren.')
  }

  return body as QuoteApiResponse
}
