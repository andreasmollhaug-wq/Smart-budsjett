import { describe, expect, it } from 'vitest'
import { getEffectiveSubscriptionPlan } from '@/lib/stripe/getEffectiveSubscriptionPlan'

describe('getEffectiveSubscriptionPlan', () => {
  it('returnerer family når Stripe er family og lokal er solo', () => {
    expect(
      getEffectiveSubscriptionPlan('solo', { plan: 'family', status: 'active' }),
    ).toBe('family')
  })

  it('returnerer solo når Stripe er solo og lokal er family', () => {
    expect(
      getEffectiveSubscriptionPlan('family', { plan: 'solo', status: 'active' }),
    ).toBe('solo')
  })

  it('returnerer lokal plan uten billing', () => {
    expect(getEffectiveSubscriptionPlan('solo', null)).toBe('solo')
    expect(getEffectiveSubscriptionPlan('family', undefined)).toBe('family')
  })

  it('returnerer lokal plan når Stripe ikke har tilgang', () => {
    expect(
      getEffectiveSubscriptionPlan('solo', { plan: 'family', status: 'canceled' }),
    ).toBe('solo')
  })

  it('returnerer lokal plan når Stripe-plan er null', () => {
    expect(
      getEffectiveSubscriptionPlan('family', { plan: null, status: 'active' }),
    ).toBe('family')
  })
})
