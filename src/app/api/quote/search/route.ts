import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_RESULTS = 50

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

  const r = await fetch(
    `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${encodeURIComponent(finnhubKey)}`,
    { cache: 'no-store' },
  )

  if (!r.ok) {
    return NextResponse.json(
      { error: `Søk feilet (${r.status}).` },
      { status: r.status >= 500 ? 502 : 400 },
    )
  }

  const data = (await r.json().catch(() => null)) as { result?: unknown } | null
  const raw = data?.result
  if (!Array.isArray(raw)) {
    return NextResponse.json({ results: [] })
  }

  type Hit = {
    description: string
    symbol: string
    displaySymbol?: string
    type: string
  }

  const results: Hit[] = raw.slice(0, MAX_RESULTS).map((row: unknown) => {
    const o = row as Record<string, unknown>
    return {
      description: typeof o.description === 'string' ? o.description : '',
      symbol: typeof o.symbol === 'string' ? o.symbol : '',
      displaySymbol: typeof o.displaySymbol === 'string' ? o.displaySymbol : undefined,
      type: typeof o.type === 'string' ? o.type : '',
    }
  })

  return NextResponse.json({ results })
}
