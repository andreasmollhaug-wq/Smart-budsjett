import { hasSubscriptionAccess } from '@/lib/stripe/subscriptionAccess'
import type { BillingPlan, BillingPlanSnapshot } from '@/lib/stripe/syncAppSubscriptionPlan'

/**
 * Plan brukt i UI og feature-gates: Stripe Familie med tilgang overstyrer lokal Solo
 * inntil persist-synk har kjørt.
 */
export function getEffectiveSubscriptionPlan(
  local: BillingPlan,
  billing: BillingPlanSnapshot | null | undefined,
): BillingPlan {
  if (
    billing &&
    hasSubscriptionAccess(billing.status) &&
    billing.plan === 'family'
  ) {
    return 'family'
  }
  if (
    billing &&
    hasSubscriptionAccess(billing.status) &&
    billing.plan === 'solo'
  ) {
    return 'solo'
  }
  return local
}
