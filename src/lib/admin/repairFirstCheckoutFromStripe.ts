import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveFirstCheckoutAt } from '@/lib/stripe/syncSubscription'

function checkoutTimestampsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return a === b
  const ams = Date.parse(a)
  const bms = Date.parse(b)
  if (!Number.isFinite(ams) || !Number.isFinite(bms)) return a === b
  return Math.abs(ams - bms) < 1000
}

export async function repairFirstCheckoutTimestampsFromStripe(
  admin: SupabaseClient,
  stripe: Stripe,
): Promise<{ updated: number; skipped: number; errors: number }> {
  const { data: rows, error } = await admin
    .from('user_subscription')
    .select('user_id, stripe_subscription_id, first_checkout_at')
    .not('stripe_subscription_id', 'is', null)

  if (error) throw error

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const row of rows ?? []) {
    const subId = row.stripe_subscription_id
    if (!subId) {
      skipped++
      continue
    }

    try {
      const sub = await stripe.subscriptions.retrieve(subId)
      const resolved = resolveFirstCheckoutAt(row, sub)
      if (!resolved) {
        skipped++
        continue
      }

      if (checkoutTimestampsEqual(row.first_checkout_at, resolved)) {
        skipped++
        continue
      }

      const { error: updErr } = await admin
        .from('user_subscription')
        .update({ first_checkout_at: resolved })
        .eq('user_id', row.user_id)

      if (updErr) {
        errors++
        continue
      }
      updated++
    } catch {
      errors++
    }
  }

  return { updated, skipped, errors }
}
