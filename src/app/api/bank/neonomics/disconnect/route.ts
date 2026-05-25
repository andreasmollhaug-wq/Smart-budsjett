import { NextResponse } from 'next/server'
import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'
import {
  deleteBankConnection,
  deleteBankConnectionById,
  getBankConnectionById,
} from '@/lib/neonomics/bankConnectionsRepo'
import { resolveNeonomicsBankId } from '@/lib/neonomics/bankCatalog'

export const dynamic = 'force-dynamic'

export async function DELETE(req: Request) {
  const auth = await requireNeonomicsApiAuth()
  if (!isAuthedContext(auth)) return auth

  const url = new URL(req.url)
  const connectionId = url.searchParams.get('connectionId')?.trim()
  const profileId = url.searchParams.get('profileId')?.trim()
  const bankIdParam = url.searchParams.get('bankId')?.trim()

  if (connectionId) {
    const conn = await getBankConnectionById(auth.supabase, auth.userId, connectionId)
    if (!conn) {
      return NextResponse.json({ error: 'Kobling ikke funnet.' }, { status: 404 })
    }
    await deleteBankConnectionById(auth.supabase, auth.userId, connectionId)
    return NextResponse.json({ ok: true })
  }

  if (!profileId) {
    return NextResponse.json({ error: 'profileId eller connectionId er påkrevd.' }, { status: 400 })
  }

  const bank = resolveNeonomicsBankId(bankIdParam)
  await deleteBankConnection(auth.supabase, auth.userId, profileId, bank.bankId)
  return NextResponse.json({ ok: true })
}
