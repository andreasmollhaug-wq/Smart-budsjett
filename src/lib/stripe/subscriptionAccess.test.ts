import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasSubscriptionAccess, isSubscriptionEnforcementEnabled } from '@/lib/stripe/subscriptionAccess'

describe('hasSubscriptionAccess', () => {
  it('godkjenner Stripe grace-statuser', () => {
    expect(hasSubscriptionAccess('active')).toBe(true)
    expect(hasSubscriptionAccess('trialing')).toBe(true)
    expect(hasSubscriptionAccess('past_due')).toBe(true)
  })

  it('godkjenner legacy_grandfathered (kun DB / migrering)', () => {
    expect(hasSubscriptionAccess('legacy_grandfathered')).toBe(true)
  })

  it('avviser manglende, inaktive eller ukjente statuser', () => {
    expect(hasSubscriptionAccess(null)).toBe(false)
    expect(hasSubscriptionAccess(undefined)).toBe(false)
    expect(hasSubscriptionAccess('inactive')).toBe(false)
    expect(hasSubscriptionAccess('canceled')).toBe(false)
    expect(hasSubscriptionAccess('')).toBe(false)
  })
})

describe('isSubscriptionEnforcementEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('er true for true / TRUE / 1 (typisk Vercel)', () => {
    vi.stubEnv('SUBSCRIPTION_ENFORCEMENT_ENABLED', 'true')
    expect(isSubscriptionEnforcementEnabled()).toBe(true)
    vi.stubEnv('SUBSCRIPTION_ENFORCEMENT_ENABLED', 'TRUE')
    expect(isSubscriptionEnforcementEnabled()).toBe(true)
    vi.stubEnv('SUBSCRIPTION_ENFORCEMENT_ENABLED', '1')
    expect(isSubscriptionEnforcementEnabled()).toBe(true)
  })

  it('er false uten satt eller ved false', () => {
    vi.stubEnv('SUBSCRIPTION_ENFORCEMENT_ENABLED', '')
    expect(isSubscriptionEnforcementEnabled()).toBe(false)
    vi.stubEnv('SUBSCRIPTION_ENFORCEMENT_ENABLED', 'false')
    expect(isSubscriptionEnforcementEnabled()).toBe(false)
  })
})
