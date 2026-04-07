import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFromStripePriceId } from '@/lib/stripe/plan'

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

  const row = {
    user_id: userId,
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    stripe_price_id: priceId ?? null,
    plan: plan ?? null,
    current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
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
