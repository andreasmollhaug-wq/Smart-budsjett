import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { upsertSubscriptionFromStripe } from '@/lib/stripe/syncSubscription'

function mockAdmin(existing: { first_checkout_at: string | null; updated_at?: string | null } | null) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn((table: string) => {
    if (table !== 'user_subscription') throw new Error(`unexpected table ${table}`)
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
      upsert,
    }
  })
  return { admin: { from } as unknown as SupabaseClient, upsert }
}

function subscription(id = 'sub_123'): Stripe.Subscription {
  return {
    id,
    status: 'trialing',
    customer: 'cus_1',
    created: 1_700_000_000,
    metadata: { supabase_user_id: 'user-1' },
    items: { data: [{ price: { id: 'price_solo' } }] },
  } as unknown as Stripe.Subscription
}

describe('upsertSubscriptionFromStripe', () => {
  it('setter first_checkout_at ved første checkout', async () => {
    const { admin, upsert } = mockAdmin(null)
    await upsertSubscriptionFromStripe(admin, subscription())
    expect(upsert).toHaveBeenCalledOnce()
    const row = upsert.mock.calls[0][0]
    expect(row.first_checkout_at).toMatch(/^\d{4}-/)
    expect(row.stripe_subscription_id).toBe('sub_123')
  })

  it('bevarer tidligere first_checkout_at når stripe subscription er nyere', async () => {
    const existing = '2025-01-15T10:00:00.000Z'
    const { admin, upsert } = mockAdmin({ first_checkout_at: existing })
    const newerSub = {
      ...subscription(),
      created: Math.floor(Date.parse('2025-06-01T10:00:00.000Z') / 1000),
    } as Stripe.Subscription
    await upsertSubscriptionFromStripe(admin, newerSub)
    const row = upsert.mock.calls[0][0]
    expect(row.first_checkout_at).toBe(existing)
  })

  it('reparerer sen backfill-dato mot stripe created', async () => {
    const { admin, upsert } = mockAdmin({ first_checkout_at: '2025-05-29T12:00:00.000Z' })
    await upsertSubscriptionFromStripe(admin, subscription())
    const row = upsert.mock.calls[0][0]
    expect(row.first_checkout_at).toBe('2023-11-14T22:13:20.000Z')
  })
})
