import { subscriptionTrialPeriodDaysForEmail } from '@/lib/stripe/extendedTrial'
import { trialPeriodDaysPreviewForAuthUser } from '@/lib/stripe/subscriptionTrialCheckout'
import { subscriptionTrialPeriodDaysFromEnv } from '@/lib/stripe/trialPeriodDaysEnv'

/**
 * Delt logikk for Stripe-prøveperiode (Checkout + API-respons til klient).
 * Se også STRIPE_TRIAL_END_DATE i subscriptionTrialCheckout.
 */
export function subscriptionTrialPeriodDays(): number | undefined {
  return subscriptionTrialPeriodDaysFromEnv()
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

/** Klient: kampanje-sluttdato (STRIPE_TRIAL_END_DATE), utvidet prøve, eller standard dager. */
export function subscriptionTrialPeriodDaysForClientForAuthUser(user: {
  id: string
  email?: string | null
  identities?: Array<{ identity_data?: Record<string, unknown> }> | null
}): number | null {
  return trialPeriodDaysPreviewForAuthUser(user)
}
