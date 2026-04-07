import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'

export const dynamic = 'force-dynamic'

const MAX_RESULTS = 50

/** Finnhub /search er ofte svak på norske tegn og fullt selskapsnavn — prøv ASCII + kjente tickere. */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function stripNorwegianLetters(s: string): string {
  return s
    .replace(/å/gi, 'a')
    .replace(/æ/gi, 'ae')
    .replace(/ø/gi, 'o')
}

/** Normalisert navn → søkeord/ticker som Finnhub treffer bedre */
const NO_NAME_ALIASES: Record<string, string> = {
  'vår energi': 'EQNR',
  'var energi': 'EQNR',
  'dnb bank': 'DNB',
}

type SearchHit = {
  description: string
  symbol: string
  displaySymbol?: string
  type: string
}

async function finnhubSearch(
  query: string,
  finnhubKey: string,
): Promise<{ hits: SearchHit[]; httpStatus: number }> {
  const r = await fetch(
    `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(finnhubKey)}`,
    { cache: 'no-store' },
  )

  if (!r.ok) {
    return { hits: [], httpStatus: r.status }
  }

  const data = (await r.json().catch(() => null)) as { result?: unknown } | null
  const raw = data?.result
  if (!Array.isArray(raw)) {
    return { hits: [], httpStatus: r.status }
  }

  const hits = raw.slice(0, MAX_RESULTS).map((row: unknown) => {
    const o = row as Record<string, unknown>
    return {
      description: typeof o.description === 'string' ? o.description : '',
      symbol: typeof o.symbol === 'string' ? o.symbol : '',
      displaySymbol: typeof o.displaySymbol === 'string' ? o.displaySymbol : undefined,
      type: typeof o.type === 'string' ? o.type : '',
    }
  })
  return { hits, httpStatus: r.status }
}

function searchAttemptsForQuery(q: string): string[] {
  const key = normalizeKey(q)
  const ascii = stripNorwegianLetters(q).trim()
  const attempts: string[] = [q]

  if (ascii.length >= 2 && ascii !== q) {
    attempts.push(ascii)
  }

  const alias = NO_NAME_ALIASES[key] ?? NO_NAME_ALIASES[normalizeKey(ascii)]
  if (alias) {
    attempts.push(alias)
  }

  const seen = new Set<string>()
  return attempts.filter((a) => {
    const k = a.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return a.length >= 2
  })
}

export async function GET(req: Request) {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const subStatus = await fetchUserSubscriptionStatus(supabase, user.id)
  const denied = subscriptionForbiddenUnlessAccess(subStatus)
  if (denied) return denied

  const finnhubKey = process.env.FINNHUB_API_KEY?.trim()
  if (!finnhubKey) {
    return NextResponse.json(
      { error: 'Kursdata er ikke konfigurert. Sett FINNHUB_API_KEY i miljøvariabler (Finnhub.io).' },
      { status: 503 },
    )
  }

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ error: 'Søket må være minst 2 tegn.' }, { status: 400 })
  }

  const attempts = searchAttemptsForQuery(q)
  let results: SearchHit[] = []
  let lastHttpError: number | null = null

  for (const term of attempts) {
    const { hits, httpStatus } = await finnhubSearch(term, finnhubKey)
    if (httpStatus >= 400) {
      lastHttpError = httpStatus
    }
    if (hits.length > 0) {
      results = hits
      break
    }
  }

  if (results.length === 0 && lastHttpError != null && lastHttpError >= 400) {
    return NextResponse.json(
      { error: `Søk feilet (${lastHttpError}).` },
      { status: lastHttpError >= 500 ? 502 : 400 },
    )
  }

  return NextResponse.json({ results })
}
