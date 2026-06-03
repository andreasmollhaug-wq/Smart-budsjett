import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFromStripePriceId } from '@/lib/stripe/plan'

/** Stripe subscription.created som ISO — nærmeste proxy for fullført checkout. */
export function checkoutIsoFromStripeSubscription(subscription: Stripe.Subscription): string | null {
  if (!subscription.id) return null
  if (subscription.created) {
    return new Date(subscription.created * 1000).toISOString()
  }
  return new Date().toISOString()
}

/**
 * Tidligste kjente checkout: min(lagret, Stripe subscription.created).
 * Fikser migrasjon-036-backfill (feil sen dato) uten å overskrive ekte første checkout ved re-subscribe.
 */
export function resolveFirstCheckoutAt(
  existing: { first_checkout_at: string | null } | null,
  subscription: Stripe.Subscription,
): string | null {
  const stripeCreated = checkoutIsoFromStripeSubscription(subscription)
  const existingAt = existing?.first_checkout_at
  if (!stripeCreated) return existingAt ?? null
  if (!existingAt) return stripeCreated

  const existingMs = Date.parse(existingAt)
  const stripeMs = Date.parse(stripeCreated)
  if (!Number.isFinite(existingMs)) return stripeCreated
  if (!Number.isFinite(stripeMs)) return existingAt

  return new Date(Math.min(existingMs, stripeMs)).toISOString()
}

/**
 * `stripe_customer_id` er UNIQUE. Samme Stripe-kunde kan i sjeldne tilfeller ha vært knyttet til
 * en annen rad; fjern kunden fra andre brukere før upsert så INSERT/UPDATE ikke feiler.
 */
async function releaseStripeCustomerForOtherUsers(
  admin: SupabaseClient,
  customerId: string | null | undefined,
  userId: string,
): Promise<void> {
  if (!customerId) return
  const { error } = await admin
    .from('user_subscription')
    .update({ stripe_customer_id: null, updated_at: new Date().toISOString() })
    .eq('stripe_customer_id', customerId)
    .neq('user_id', userId)
  if (error) {
    console.error('[stripe] releaseStripeCustomerForOtherUsers', error)
    throw error
  }
}

export async function upsertSubscriptionFromStripe(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
  userIdFallback?: string
): Promise<void> {
  const userId = subscription.metadata?.supabase_user_id ?? userIdFallback
  if (!userId) {
    console.warn('[stripe] Subscription mangler bruker-id (metadata / client_reference_id)', subscription.id)
    return
  }

  /** `items` kan mangle i noen API-varianter uten expand — ikke bruk `.data` uten optional chaining. */
  const firstItem = subscription.items?.data?.[0]
  const priceRef = firstItem?.price
  const priceId = typeof priceRef === 'string' ? priceRef : priceRef?.id
  const plan = planFromStripePriceId(priceId)
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  /** Nyere Stripe-API (f.eks. basil): periode ofte på linje; eldre på Subscription. */
  const itemPeriod = (firstItem as { current_period_end?: number } | undefined)?.current_period_end
  const subPeriod = (subscription as { current_period_end?: number }).current_period_end
  const periodEndUnix = itemPeriod ?? subPeriod

  await releaseStripeCustomerForOtherUsers(admin, customerId, userId)

  const nowIso = new Date().toISOString()
  const { data: existing } = await admin
    .from('user_subscription')
    .select('first_checkout_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  const firstCheckoutAt = resolveFirstCheckoutAt(existing, subscription)

  const row = {
    user_id: userId,
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    stripe_price_id: priceId ?? null,
    plan: plan ?? null,
    current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    first_checkout_at: firstCheckoutAt,
    updated_at: nowIso,
  }

  const { error } = await admin.from('user_subscription').upsert(row, { onConflict: 'user_id' })
  if (error) {
    console.error('[stripe] upsert user_subscription', error)
    throw error
  }
}

export async function markSubscriptionCanceled(
  admin: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) return

  const { error } = await admin
    .from('user_subscription')
    .update({
      status: 'canceled',
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[stripe] mark canceled', error)
    throw error
  }
}
