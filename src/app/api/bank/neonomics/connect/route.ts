import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'
import { runNeonomicsConnect } from '@/lib/neonomics/connectFlow'
import { NeonomicsApiError } from '@/lib/neonomics/errors'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireNeonomicsApiAuth()
  if (!isAuthedContext(auth)) return auth

  const body = (await req.json().catch(() => null)) as {
    profileId?: string
    bankId?: string
  } | null
  const profileId = body?.profileId?.trim()
  if (!profileId) {
    return NextResponse.json({ error: 'profileId er påkrevd.' }, { status: 400 })
  }

  try {
    const result = await runNeonomicsConnect(
      auth.supabase,
      auth.userId,
      profileId,
      req,
      body?.bankId?.trim(),
    )
    if (result.needsConsent) {
      return NextResponse.json({
        needsConsent: true,
        consentUrl: result.consentUrl,
        bankAuthUrl: result.bankAuthUrl,
        bankId: result.bankId,
      })
    }
    return NextResponse.json({
      needsConsent: false,
      bankId: result.bankId,
      accounts: result.accounts.map((a) => ({
        id: a.id,
        iban: a.iban,
        displayName: a.displayName ?? a.accountName,
      })),
    })
  } catch (e) {
    if (e instanceof NeonomicsApiError) {
      return NextResponse.json(
        { error: e.message, errorCode: e.errorCode },
        { status: e.statusCode >= 400 ? e.statusCode : 510 },
      )
    }
    const msg = e instanceof Error ? e.message : 'Kunne ikke koble bank.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
