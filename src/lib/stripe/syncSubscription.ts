import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { planFromStripePriceId } from '@/lib/stripe/plan'

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

  const firstItem = subscription.items.data[0]
  const priceId = firstItem?.price.id
  const plan = planFromStripePriceId(priceId)
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  const periodEndUnix = firstItem?.current_period_end
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
