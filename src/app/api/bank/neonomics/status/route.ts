import { NextResponse } from 'next/server'
import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'
import { listBankConnections } from '@/lib/neonomics/bankConnectionsRepo'
import { connectionToStatusDto } from '@/lib/neonomics/connectionStatus'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireNeonomicsApiAuth()
  if (!isAuthedContext(auth)) return auth

  const url = new URL(req.url)
  const profileId = url.searchParams.get('profileId')?.trim()
  if (!profileId) {
    return NextResponse.json({ error: 'profileId er påkrevd.' }, { status: 400 })
  }

  const rows = await listBankConnections(auth.supabase, auth.userId, profileId)
  const connections = rows.map(connectionToStatusDto)

  const first = connections[0]
  return NextResponse.json({
    connections,
    connected: connections.length > 0,
    consentOk: connections.some((c) => c.consentOk),
    bankDisplayName: first?.bankDisplayName ?? null,
    selectedAccountId: first?.selectedAccountId ?? null,
    lastSyncAt: first?.lastSyncAt ?? null,
    lastSyncFetchedCount: first?.lastSyncFetchedCount ?? null,
    lastSyncError: first?.lastSyncError ?? null,
  })
}
