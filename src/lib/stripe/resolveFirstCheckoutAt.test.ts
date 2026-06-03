import { describe, expect, it } from 'vitest'
import type Stripe from 'stripe'
import {
  checkoutIsoFromStripeSubscription,
  resolveFirstCheckoutAt,
} from '@/lib/stripe/syncSubscription'

describe('resolveFirstCheckoutAt', () => {
  const sub = {
    id: 'sub_1',
    created: 1_700_000_000,
  } as Stripe.Subscription

  it('bruker Stripe created ved ny checkout', () => {
    expect(resolveFirstCheckoutAt(null, sub)).toBe('2023-11-14T22:13:20.000Z')
  })

  it('bevarer tidligere checkout når stripe subscription er nyere (re-subscribe)', () => {
    const resub = {
      id: 'sub_2',
      created: Math.floor(Date.parse('2025-06-01T10:00:00.000Z') / 1000),
    } as Stripe.Subscription
    expect(
      resolveFirstCheckoutAt({ first_checkout_at: '2025-01-15T10:00:00.000Z' }, resub),
    ).toBe('2025-01-15T10:00:00.000Z')
  })

  it('reparerer backfill med sen dato (tar min av lagret og Stripe)', () => {
    expect(
      resolveFirstCheckoutAt({ first_checkout_at: '2025-05-29T12:00:00.000Z' }, sub),
    ).toBe('2023-11-14T22:13:20.000Z')
  })

  it('reparerer selv om updated_at har endret seg siden migrasjon', () => {
    expect(
      resolveFirstCheckoutAt(
        {
          first_checkout_at: '2025-05-29T12:00:00.000Z',
        },
        sub,
      ),
    ).toBe('2023-11-14T22:13:20.000Z')
  })
})

describe('checkoutIsoFromStripeSubscription', () => {
  it('returnerer null uten subscription id', () => {
    expect(checkoutIsoFromStripeSubscription({ id: '' } as Stripe.Subscription)).toBeNull()
  })
})
