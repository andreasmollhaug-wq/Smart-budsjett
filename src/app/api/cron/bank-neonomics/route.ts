import { NextResponse } from 'next/server'
import { runBankAutoImportForConnection } from '@/lib/neonomics/bankAutoImportServer'
import { listAutoSyncBankConnections } from '@/lib/neonomics/bankConnectionsRepo'
import { createServiceRoleClient } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Daglig bankhenting for koblinger med auto_sync_enabled.
 * Planlagt ca. kl. 10:00 norsk vintertid: `0 9 * * *` UTC (se vercel.json).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Ikke autorisert.' }, { status: 401 })
  }

  const admin = createServiceRoleClient()
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY mangler.' }, { status: 503 })
  }

  const connections = await listAutoSyncBankConnections(admin)
  if (connections.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'Ingen auto-sync bankkoblinger.',
      processed: 0,
    })
  }

  let success = 0
  let failed = 0
  let needsConsent = 0
  const errors: { connectionId: string; error: string }[] = []

  for (const conn of connections) {
    const result = await runBankAutoImportForConnection(admin, conn, 'cron', null)
    if (result.ok) {
      success++
    } else if (!result.ok && result.needsConsent) {
      needsConsent++
    } else {
      failed++
      errors.push({
        connectionId: conn.id,
        error: !result.ok ? result.error : 'unknown',
      })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: connections.length,
    success,
    failed,
    needsConsent,
    errors: errors.slice(0, 20),
  })
}
