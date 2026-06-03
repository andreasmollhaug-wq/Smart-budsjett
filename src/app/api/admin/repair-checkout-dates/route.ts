import { NextResponse } from 'next/server'
import { repairFirstCheckoutTimestampsFromStripe } from '@/lib/admin/repairFirstCheckoutFromStripe'
import { requireAdminViewerAccess } from '@/lib/admin/adminViewerAccess'
import { getStripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 503 })
  }

  const access = await requireAdminViewerAccess(supabase)
  if (!access.ok) {
    return NextResponse.json({ error: 'Ingen tilgang.' }, { status: 403 })
  }

  const stripe = getStripe()
  const admin = createServiceRoleClient()
  if (!stripe || !admin) {
    return NextResponse.json({ error: 'Stripe eller database mangler.' }, { status: 503 })
  }

  try {
    const result = await repairFirstCheckoutTimestampsFromStripe(admin, stripe)
    return NextResponse.json(result)
  } catch (e) {
    console.error('[admin] repair-checkout-dates', e)
    return NextResponse.json({ error: 'Kunne ikke reparere checkout-datoer.' }, { status: 500 })
  }
}
