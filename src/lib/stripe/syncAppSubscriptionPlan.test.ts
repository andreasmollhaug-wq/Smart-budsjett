import { describe, expect, it } from 'vitest'
import { computeSyncAppPlan } from '@/lib/stripe/syncAppSubscriptionPlan'

describe('computeSyncAppPlan', () => {
  it('setter family når Stripe er family og lokal er solo', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: 'family', status: 'active' },
        localPlan: 'solo',
        profileCount: 1,
      }),
    ).toEqual({ action: 'set', plan: 'family' })
  })

  it('setter solo når Stripe er solo og én profil', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: 'solo', status: 'trialing' },
        localPlan: 'family',
        profileCount: 1,
      }),
    ).toEqual({ action: 'set', plan: 'solo' })
  })

  it('blokkerer nedgradering når Stripe er solo men flere profiler', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: 'solo', status: 'active' },
        localPlan: 'family',
        profileCount: 2,
      }),
    ).toEqual({ action: 'blocked_downgrade', stripePlan: 'solo', profileCount: 2 })
  })

  it('returnerer plan_unknown når plan mangler men tilgang finnes', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: null, status: 'active' },
        localPlan: 'solo',
        profileCount: 1,
      }),
    ).toEqual({ action: 'none', reason: 'plan_unknown' })
  })

  it('returnerer no_access uten gyldig status', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: 'family', status: 'canceled' },
        localPlan: 'solo',
        profileCount: 1,
      }),
    ).toEqual({ action: 'none', reason: 'no_access' })
  })

  it('returnerer already_matches når family allerede er satt', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: 'family', status: 'active' },
        localPlan: 'family',
        profileCount: 2,
      }),
    ).toEqual({ action: 'none', reason: 'already_matches' })
  })

  it('legacy_grandfathered med family-plan synker til family', () => {
    expect(
      computeSyncAppPlan({
        billing: { plan: 'family', status: 'legacy_grandfathered' },
        localPlan: 'solo',
        profileCount: 1,
      }),
    ).toEqual({ action: 'set', plan: 'family' })
  })
})
