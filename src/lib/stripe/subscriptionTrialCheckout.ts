import { exclusiveEndOfOsloYmdAsUnixSeconds } from '@/lib/stripe/osloZonedTime'
import { subscriptionTrialPeriodDaysForAuthUser } from '@/lib/stripe/extendedTrial'
import { subscriptionTrialPeriodDaysFromEnv } from '@/lib/stripe/trialPeriodDaysEnv'

export type ResolvedSubscriptionTrial =
  | { kind: 'trial_end'; trialEndUnix: number }
  | { kind: 'trial_period_days'; trialPeriodDays: number }
  | { kind: 'none' }

type AuthUserLike = {
  id: string
  email?: string | null
  identities?: Array<{ identity_data?: Record<string, unknown> }> | null
}

/** Leser STRIPE_TRIAL_END_DATE=YYYY-MM-DD (siste inkluderte dag, Europe/Oslo). */
function trialCampaignEndExclusiveUnixFromEnv(): number | null {
  const raw = process.env.STRIPE_TRIAL_END_DATE?.trim()
  if (!raw) return null
  return exclusiveEndOfOsloYmdAsUnixSeconds(raw)
}

/**
 * Stripe subscription_data: enten trial_end eller trial_period_days (aldri begge).
 * Under aktiv STRIPE_TRIAL_END_DATE brukes trial_end (evt. kortet mot utvidet VIP-prøve).
 */
export function resolveSubscriptionTrialForCheckout(
  user: AuthUserLike,
  nowMs: number = Date.now()
): ResolvedSubscriptionTrial {
  const nowSec = Math.floor(nowMs / 1000)
  const campaignEndExclusive = trialCampaignEndExclusiveUnixFromEnv()

  if (campaignEndExclusive != null && nowSec < campaignEndExclusive) {
    let trialEndUnix = campaignEndExclusive
    const extDays = subscriptionTrialPeriodDaysForAuthUser(user)
    if (extDays != null) {
      const extEndUnix = nowSec + extDays * 86400
      trialEndUnix = Math.min(trialEndUnix, extEndUnix)
    }
    if (trialEndUnix > nowSec) {
      return { kind: 'trial_end', trialEndUnix }
    }
    return { kind: 'none' }
  }

  const trialDays = subscriptionTrialPeriodDaysForAuthUser(user) ?? subscriptionTrialPeriodDaysFromEnv()
  if (trialDays == null) return { kind: 'none' }
  return { kind: 'trial_period_days', trialPeriodDays: trialDays }
}

export function stripeCheckoutSubscriptionTrialFields(
  resolved: ResolvedSubscriptionTrial
): { trial_end?: number; trial_period_days?: number } {
  if (resolved.kind === 'trial_end') {
    return { trial_end: resolved.trialEndUnix }
  }
  if (resolved.kind === 'trial_period_days') {
    return { trial_period_days: resolved.trialPeriodDays }
  }
  return {}
}

/** For klient (modal): avrund opp til hele dager igjen for trial_end, ellers dager fra env/VIP. */
export function trialPeriodDaysPreviewForAuthUser(
  user: AuthUserLike,
  nowMs: number = Date.now()
): number | null {
  const r = resolveSubscriptionTrialForCheckout(user, nowMs)
  if (r.kind === 'trial_end') {
    const nowSec = Math.floor(nowMs / 1000)
    const secsLeft = r.trialEndUnix - nowSec
    if (secsLeft <= 0) return null
    return Math.max(1, Math.ceil(secsLeft / 86400))
  }
  if (r.kind === 'trial_period_days') return r.trialPeriodDays
  return null
}
