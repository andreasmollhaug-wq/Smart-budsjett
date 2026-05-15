/**
 * Standard prøvelengde fra miljø (uten kampanje-sluttdato — se subscriptionTrialCheckout).
 * Default 14; STRIPE_SUBSCRIPTION_TRIAL_DAYS=0 eller ugyldig → ingen prøveperiode i Checkout.
 */
export function subscriptionTrialPeriodDaysFromEnv(): number | undefined {
  const raw = process.env.STRIPE_SUBSCRIPTION_TRIAL_DAYS
  const fallback = 14
  if (raw === undefined || raw === '') {
    return fallback
  }
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}
