import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Valutakurs til NOK (Frankfurter, server-side) — unngår at nettleseren må kalle eksternt API
 * (blokkering, CORS, «Failed to fetch»).
 */
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

  const url = new URL(req.url)
  const from = url.searchParams.get('from')?.trim().toUpperCase() ?? ''
  if (!from || from === 'NOK') {
    return NextResponse.json({ rateToNok: 1 })
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=NOK`,
      { cache: 'no-store' },
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Kunne ikke hente valutakurs.' }, { status: 502 })
    }
    const data = (await res.json().catch(() => null)) as { rates?: { NOK?: number } } | null
    const r = data?.rates?.NOK
    if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) {
      return NextResponse.json({ error: `Ingen kurs til NOK for ${from}.` }, { status: 400 })
    }
    return NextResponse.json({ rateToNok: r })
  } catch {
    return NextResponse.json({ error: 'Valutakurs ikke tilgjengelig akkurat nå.' }, { status: 503 })
  }
}
