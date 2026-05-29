import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'
import {
  bankCatalogToDto,
  getUiNeonomicsBanks,
  refreshNeonomicsBankCatalog,
} from '@/lib/neonomics/bankCatalog'
import { buildNeonomicsContext } from '@/lib/neonomics/requestContext'

export const dynamic = 'force-dynamic'

/** Banker Neonomics har aktivert for appen (hentes live fra /ics/v3/banks). */
export async function GET(req: NextRequest) {
  const auth = await requireNeonomicsApiAuth()
  if (!isAuthedContext(auth)) return auth

  const profileId = req.nextUrl.searchParams.get('profileId')?.trim()
  if (!profileId) {
    return NextResponse.json({ error: 'profileId er påkrevd.' }, { status: 400 })
  }

  try {
    const ctx = buildNeonomicsContext(auth.userId, profileId, req)
    await refreshNeonomicsBankCatalog(ctx)
    const banks = getUiNeonomicsBanks().map(bankCatalogToDto)
    return NextResponse.json({ banks })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kunne ikke hente bankliste.'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
