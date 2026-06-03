import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  computeAppReadOnly,
  hasSubscriptionAccess,
  isSubscriptionEnforcementEnabled,
  SUBSCRIPTION_FULL_ACCESS_STATUSES,
  SUBSCRIPTION_GRACE_STATUSES,
  type SubscriptionGraceStatus,
} from '@/lib/stripe/subscriptionAccessCore'

export {
  computeAppReadOnly,
  hasSubscriptionAccess,
  isSubscriptionEnforcementEnabled,
  SUBSCRIPTION_FULL_ACCESS_STATUSES,
  SUBSCRIPTION_GRACE_STATUSES,
  type SubscriptionGraceStatus,
}

/** Feilmelding til API-respons når bruker ikke har aktivt abonnement (403). */
export const SUBSCRIPTION_REQUIRED_MESSAGE =
  'Abonnement er ikke aktivt. Gå til Betalinger for å registrere betaling.' as const

/** Bruk i API routes: `const d = subscriptionForbiddenUnlessAccess(subStatus); if (d) return d` */
export function subscriptionForbiddenUnlessAccess(
  subStatus: string | null,
): NextResponse | null {
  if (!isSubscriptionEnforcementEnabled()) return null
  if (!hasSubscriptionAccess(subStatus)) {
    return NextResponse.json({ error: SUBSCRIPTION_REQUIRED_MESSAGE }, { status: 403 })
  }
  return null
}

export async function fetchUserSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('user_subscription')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.status ?? null
}
