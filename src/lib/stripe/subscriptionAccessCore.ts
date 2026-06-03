/**
 * Abonnementsflagg uten `next/server` — trygt for middleware / edge.
 */
export function isSubscriptionEnforcementEnabled(): boolean {
  const v = process.env.SUBSCRIPTION_ENFORCEMENT_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1'
}

/** Stripe-statuser som gir tilgang til appen (grace: past_due mens Stripe prøver trekk på nytt). */
export const SUBSCRIPTION_GRACE_STATUSES = ['active', 'trialing', 'past_due'] as const

/**
 * Statuser som gir full tilgang i app og database-RLS.
 * `legacy_grandfathered` settes kun ved migrering / manuelt — ikke fra Stripe.
 */
export const SUBSCRIPTION_FULL_ACCESS_STATUSES = [
  ...SUBSCRIPTION_GRACE_STATUSES,
  'legacy_grandfathered',
] as const

export type SubscriptionGraceStatus = (typeof SUBSCRIPTION_GRACE_STATUSES)[number]

export function hasSubscriptionAccess(status: string | null | undefined): boolean {
  if (!status) return false
  return (SUBSCRIPTION_FULL_ACCESS_STATUSES as readonly string[]).includes(status)
}

export function computeAppReadOnly(subscriptionStatus: string | null | undefined): boolean {
  if (!isSubscriptionEnforcementEnabled()) return false
  return !hasSubscriptionAccess(subscriptionStatus)
}
