import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE_ID, useStore } from '@/lib/store'

describe('billing plan sync i store', () => {
  beforeEach(() => {
    useStore.setState({
      subscriptionPlan: 'solo',
      lastBillingSnapshot: null,
      profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
      activeProfileId: DEFAULT_PROFILE_ID,
      financeScope: 'profile',
    })
  })

  it('applyBillingPlanSync oppgraderer til family fra Stripe', () => {
    const result = useStore.getState().applyBillingPlanSync({
      plan: 'family',
      status: 'active',
    })
    expect(result).toEqual({ action: 'set', plan: 'family' })
    expect(useStore.getState().subscriptionPlan).toBe('family')
  })

  it('addProfile tillater ny profil når Stripe er family men lokal plan er solo', () => {
    useStore.setState({
      subscriptionPlan: 'solo',
      lastBillingSnapshot: { plan: 'family', status: 'active' },
    })
    const res = useStore.getState().addProfile('Partner')
    expect(res.ok).toBe(true)
    expect(useStore.getState().profiles).toHaveLength(2)
  })

  it('addProfile blokkerer når effektiv plan er solo og det finnes én profil', () => {
    const res = useStore.getState().addProfile('Partner')
    expect(res).toEqual({ ok: false, reason: 'solo_limit' })
  })
})
