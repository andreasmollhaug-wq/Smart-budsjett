import { NextResponse } from 'next/server'
import { listAllAuthUserSnapshots } from '@/lib/admin/adminAuthUsers'
import { requireAdminViewerAccess } from '@/lib/admin/adminViewerAccess'
import { buildAdminMetrics, fetchSubscriptionMetricsRows } from '@/lib/admin/buildAdminMetrics'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function accessErrorResponse(reason: string) {
  switch (reason) {
    case 'unauthenticated':
      return NextResponse.json(
        { error: 'Du må være innlogget.', code: 'admin_unauthenticated' },
        { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
      )
    case 'mfa_step_up_required':
      return NextResponse.json(
        { error: 'Fullfør tofaktorinnlogging.', code: 'admin_mfa_step_up' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
      )
    case 'mfa_not_enrolled':
      return NextResponse.json(
        { error: 'Admin krever aktivert tofaktor.', code: 'admin_mfa_enroll' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
      )
    case 'not_allowlisted':
      return NextResponse.json(
        { error: 'Ingen tilgang.', code: 'admin_forbidden' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
      )
    default:
      return NextResponse.json(
        { error: 'Serverkonfigurasjon mangler.', code: 'admin_config' },
        { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
      )
  }
}

export async function GET() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return accessErrorResponse('config')
  }

  const access = await requireAdminViewerAccess(supabase)
  if (!access.ok) {
    return accessErrorResponse(access.reason)
  }

  const admin = createServiceRoleClient()
  if (!admin) {
    return accessErrorResponse('config')
  }

  try {
    const [authUsers, subscriptions] = await Promise.all([
      listAllAuthUserSnapshots(admin),
      fetchSubscriptionMetricsRows(admin),
    ])
    const payload = buildAdminMetrics(authUsers, subscriptions)
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    console.error('[admin] metrics', e)
    return NextResponse.json(
      { error: 'Kunne ikke hente metrics.', code: 'admin_metrics_error' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }
}
