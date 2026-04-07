import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Når `true` (sett `SUBSCRIPTION_ENFORCEMENT_ENABLED=true` i miljø): API krever aktivt abonnement der det sjekkes;
 * i appen vises innhold skrivebeskyttet uten abonnement (unntatt /konto), uten hard redirect.
 * Når `false` eller utelatt: alle innloggede brukere har full tilgang i app og API (unntatt der annet er dokumentert).
 */
export function isSubscriptionEnforcementEnabled(): boolean {
  return process.env.SUBSCRIPTION_ENFORCEMENT_ENABLED === 'true'
}

/** Stripe-statuser som gir tilgang til appen (grace: past_due mens Stripe prøver trekk på nytt). */
export const SUBSCRIPTION_GRACE_STATUSES = ['active', 'trialing', 'past_due'] as const

export type SubscriptionGraceStatus = (typeof SUBSCRIPTION_GRACE_STATUSES)[number]

export function hasSubscriptionAccess(status: string | null | undefined): boolean {
  if (!status) return false
  return (SUBSCRIPTION_GRACE_STATUSES as readonly string[]).includes(status)
}

/**
 * Når håndheving er på og brukeren ikke har aktiv prøveperiode/abonnement:
 * appen er skrivebeskyttet (se rundt, ikke endre) unntatt under /konto.
 */
export function computeAppReadOnly(subscriptionStatus: string | null | undefined): boolean {
  if (!isSubscriptionEnforcementEnabled()) return false
  return !hasSubscriptionAccess(subscriptionStatus)
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
