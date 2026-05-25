import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isNeonomicsServerEnabled } from '@/lib/neonomics/feature'
import {
  fetchUserSubscriptionStatus,
  subscriptionForbiddenUnlessAccess,
} from '@/lib/stripe/subscriptionAccess'

export type NeonomicsAuthedContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}

export async function requireNeonomicsApiAuth(): Promise<
  NeonomicsAuthedContext | NextResponse
> {
  if (!isNeonomicsServerEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
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
  const subStatus = await fetchUserSubscriptionStatus(supabase, user.id)
  const denied = subscriptionForbiddenUnlessAccess(subStatus)
  if (denied) return denied
  return { supabase, userId: user.id }
}

export function isAuthedContext(
  r: NeonomicsAuthedContext | NextResponse,
): r is NeonomicsAuthedContext {
  return !(r instanceof NextResponse)
}
