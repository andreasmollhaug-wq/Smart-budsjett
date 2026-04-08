/**
 * Utvalgte brukere kan få lengre prøveperiode enn standard (STRIPE_SUBSCRIPTION_TRIAL_DAYS).
 * E-poster: STRIPE_EXTENDED_TRIAL_EMAILS. Valgfritt: STRIPE_EXTENDED_TRIAL_USER_IDS (Supabase user_id UUID).
 * Dager: STRIPE_EXTENDED_TRIAL_DAYS (default 183 ≈ 6 mnd).
 *
 * Merk: Endring her påvirker kun nye Checkout-økter. Eksisterende Stripe-abonnement må forlenges i Stripe Dashboard
 * eller ved ny gjennomføring av Checkout.
 */

function parseEmailAllowlist(): Set<string> {
  const raw = process.env.STRIPE_EXTENDED_TRIAL_EMAILS ?? ''
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )
}

function parseUserIdAllowlist(): Set<string> {
  const raw = process.env.STRIPE_EXTENDED_TRIAL_USER_IDS ?? ''
  return new Set(raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean))
}

/** Primær e-post fra Supabase User (noen leverandører legger den kun under identities). */
export function authPrimaryEmail(user: {
  email?: string | null
  identities?: Array<{ identity_data?: Record<string, unknown> }> | null
}): string | null {
  const direct = user.email?.trim()
  if (direct) return direct.toLowerCase()
  for (const id of user.identities ?? []) {
    const e = id.identity_data?.email
    if (typeof e === 'string' && e.trim()) return e.trim().toLowerCase()
  }
  return null
}

export function extendedTrialPeriodDays(): number {
  const raw = process.env.STRIPE_EXTENDED_TRIAL_DAYS
  const fallback = 183
  if (raw === undefined || raw === '') {
    return fallback
  }
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

/** Returnerer utvidet prøveperiode i dager hvis e-post er på listen; ellers `undefined`. */
export function subscriptionTrialPeriodDaysForEmail(
  email: string | null | undefined
): number | undefined {
  if (!email) return undefined
  const normalized = email.trim().toLowerCase()
  if (!normalized) return undefined
  if (!parseEmailAllowlist().has(normalized)) return undefined
  return extendedTrialPeriodDays()
}

type AuthUserLike = {
  id: string
  email?: string | null
  identities?: Array<{ identity_data?: Record<string, unknown> }> | null
}

/** E-postliste eller bruker-ID-liste (Supabase). Brukes i Checkout og subscription-API. */
export function subscriptionTrialPeriodDaysForAuthUser(user: AuthUserLike): number | undefined {
  if (parseUserIdAllowlist().has(user.id)) {
    return extendedTrialPeriodDays()
  }
  return subscriptionTrialPeriodDaysForEmail(authPrimaryEmail(user))
}
