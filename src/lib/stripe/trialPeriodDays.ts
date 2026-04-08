import {
  subscriptionTrialPeriodDaysForAuthUser,
  subscriptionTrialPeriodDaysForEmail,
} from '@/lib/stripe/extendedTrial'

/**
 * Delt logikk for Stripe-prøveperiode (Checkout + API-respons til klient).
 * Default 14 dager; STRIPE_SUBSCRIPTION_TRIAL_DAYS=0 eller ugyldig → ingen prøveperiode i Checkout.
 */
export function subscriptionTrialPeriodDays(): number | undefined {
  const raw = process.env.STRIPE_SUBSCRIPTION_TRIAL_DAYS
  const fallback = 14
  if (raw === undefined || raw === '') {
    return fallback
  }
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

/** For JSON til klient: `null` når prøveperiode er av. */
export function subscriptionTrialPeriodDaysForClient(): number | null {
  const n = subscriptionTrialPeriodDays()
  return n === undefined ? null : n
}

/** Klient: utvidet prøve for VIP-e-poster, ellers samme som `subscriptionTrialPeriodDaysForClient`. */
export function subscriptionTrialPeriodDaysForClientForEmail(
  email: string | null | undefined
): number | null {
  const extended = subscriptionTrialPeriodDaysForEmail(email)
  if (extended != null) return extended
  return subscriptionTrialPeriodDaysForClient()
}

/** Klient: utvidet prøve via e-post- eller bruker-ID-liste (anbefalt for API). */
export function subscriptionTrialPeriodDaysForClientForAuthUser(user: {
  id: string
  email?: string | null
  identities?: Array<{ identity_data?: Record<string, unknown> }> | null
}): number | null {
  const extended = subscriptionTrialPeriodDaysForAuthUser(user)
  if (extended != null) return extended
  return subscriptionTrialPeriodDaysForClient()
}
