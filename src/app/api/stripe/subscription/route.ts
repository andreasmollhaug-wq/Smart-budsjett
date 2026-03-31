import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
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

  const { data, error } = await supabase
    .from('user_subscription')
    .select(
      'status, plan, stripe_price_id, current_period_end, stripe_subscription_id, updated_at'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[stripe] subscription GET', error)
    return NextResponse.json({ error: 'Kunne ikke hente abonnement.' }, { status: 500 })
  }

  return NextResponse.json({ subscription: data ?? null })
}
