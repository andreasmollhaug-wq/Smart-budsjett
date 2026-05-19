import { hasSubscriptionAccess } from '@/lib/stripe/subscriptionAccess'

export type BillingPlan = 'solo' | 'family'

export type BillingPlanSnapshot = {
  plan: BillingPlan | null
  status: string | null
}

export type SyncAppPlanInput = {
  billing: BillingPlanSnapshot
  localPlan: BillingPlan
  profileCount: number
}

export type SyncAppPlanResult =
  | { action: 'set'; plan: BillingPlan }
  | { action: 'none'; reason: 'no_access' | 'plan_unknown' | 'already_matches' }
  | { action: 'blocked_downgrade'; stripePlan: 'solo'; profileCount: number }

/**
 * Bestemmer om lokal `subscriptionPlan` skal oppdateres fra Stripe/Supabase `user_subscription`.
 * Stripe-plan er autoritativ når brukeren har tilgang (active / trialing / past_due / legacy_grandfathered).
 */
export function computeSyncAppPlan(input: SyncAppPlanInput): SyncAppPlanResult {
  const { billing, localPlan, profileCount } = input

  if (!hasSubscriptionAccess(billing.status)) {
    return { action: 'none', reason: 'no_access' }
  }

  const stripePlan = billing.plan
  if (stripePlan === null) {
    return { action: 'none', reason: 'plan_unknown' }
  }

  if (stripePlan === 'family') {
    if (localPlan === 'family') {
      return { action: 'none', reason: 'already_matches' }
    }
    return { action: 'set', plan: 'family' }
  }

  // stripePlan === 'solo'
  if (profileCount > 1) {
    return { action: 'blocked_downgrade', stripePlan: 'solo', profileCount }
  }

  if (localPlan === 'solo') {
    return { action: 'none', reason: 'already_matches' }
  }

  return { action: 'set', plan: 'solo' }
}
