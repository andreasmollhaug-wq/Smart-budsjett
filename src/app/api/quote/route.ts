import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'
import { fetchFinnhubSnapshot } from '@/lib/finnhubQuotesServer'

export const dynamic = 'force-dynamic'

const MAX_SYMBOLS = 10

function parseSymbols(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
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
      {
        error:
          'Kursdata er ikke konfigurert. Sett FINNHUB_API_KEY i miljøvariabler (Finnhub.io).',
      },
      { status: 503 },
    )
  }

  const url = new URL(req.url)
  const symbols = parseSymbols(url.searchParams.get('symbols') ?? '')

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'Oppgi minst én ticker i symbols (kommaseparert).' },
      { status: 400 },
    )
  }

  if (symbols.length > MAX_SYMBOLS) {
    return NextResponse.json(
      { error: `Maks ${MAX_SYMBOLS} tickere per oppslag.` },
      { status: 400 },
    )
  }

  const settled = await Promise.allSettled(
    symbols.map((symbol) => fetchFinnhubSnapshot(symbol, finnhubKey)),
  )

  const results = settled.map((out, i) => {
    const symbol = symbols[i] ?? ''
    if (out.status === 'fulfilled') {
      return out.value
    }
    const msg =
      out.reason instanceof Error ? out.reason.message : typeof out.reason === 'string' ? out.reason : 'Ukjent feil'
    return { ok: false as const, symbol, error: msg }
  })

  return NextResponse.json({ results })
}
