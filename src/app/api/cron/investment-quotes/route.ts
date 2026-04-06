import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import type { PersistedAppSlice } from '@/lib/store'
import {
  buildGlobalQuoteAndRateCaches,
  collectTrackedSymbolsFromSlice,
  syncPersistedSliceWithCaches,
} from '@/lib/investmentQuoteSyncServer'

export const dynamic = 'force-dynamic'
/** Lang kjøring ved mange brukere — krever passende Vercel-plan. */
export const maxDuration = 300

/**
 * Daglig oppdatering av kurs for kurskoblede aksje-/fondsposisjoner (kun `quoteSymbol` + `shares`).
 * Kaller Finnhub + Frankfurter og skriver til `user_app_state`.
 *
 * Sikring: `Authorization: Bearer $CRON_SECRET` (Vercel Cron setter dette når CRON_SECRET er satt).
 * Planlagt ca. kl. 16:00 norsk vintertid: `0 15 * * *` UTC (se vercel.json).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Ikke autorisert.' }, { status: 401 })
  }

  const finnhubKey = process.env.FINNHUB_API_KEY?.trim()
  if (!finnhubKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY mangler.' }, { status: 503 })
  }

  const admin = createServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY mangler.' }, { status: 503 })
  }

  const { data: rows, error } = await admin.from('user_app_state').select('user_id, state')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = rows ?? []
  const allSymbols = new Set<string>()
  for (const row of list) {
    const s = row.state as PersistedAppSlice | null
    if (!s?.people) continue
    for (const sym of collectTrackedSymbolsFromSlice(s)) {
      allSymbols.add(sym)
    }
  }

  if (allSymbols.size === 0) {
    return NextResponse.json({
      ok: true,
      message: 'Ingen kurskoblede posisjoner hos noen brukere.',
      usersScanned: list.length,
      usersUpdated: 0,
      symbolsFetched: 0,
    })
  }

  const { quoteCache, rateCache } = await buildGlobalQuoteAndRateCaches(allSymbols, finnhubKey)

  let usersUpdated = 0
  for (const row of list) {
    const state = row.state as PersistedAppSlice | null
    if (!state?.people) continue
    if (collectTrackedSymbolsFromSlice(state).size === 0) continue

    const next = syncPersistedSliceWithCaches(state, quoteCache, rateCache)
    const { error: upErr } = await admin
      .from('user_app_state')
      .update({
        state: next as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', row.user_id)

    if (!upErr) usersUpdated++
  }

  return NextResponse.json({
    ok: true,
    usersScanned: list.length,
    usersUpdated,
    symbolsFetched: allSymbols.size,
  })
}
