import { describe, expect, it } from 'vitest'
import {
  computeActiveMrr,
  computePlanMrrBreakdown,
  computeTrialPotentialMrr,
  formatAdminNok,
  scalePlanMrrToAnnual,
} from '@/lib/admin/adminPlanMrr'
import type { AdminSubscriberEntry } from '@/lib/admin/types'

function subscriber(
  status: string,
  plan: 'solo' | 'family' | null,
  id: string,
): AdminSubscriberEntry {
  return {
    userId: id,
    email: `${id}@example.com`,
    displayName: null,
    plan,
    planLabel: plan === 'solo' ? 'Solo' : plan === 'family' ? 'Familie' : 'Ukjent plan',
    status,
    statusLabel: status,
    hasStripeSubscription: true,
  }
}

describe('computePlanMrrBreakdown', () => {
  it('beregner prøve-MRR', () => {
    const mrr = computeTrialPotentialMrr([
      subscriber('trialing', 'solo', 'u1'),
      subscriber('trialing', 'family', 'u2'),
    ])
    expect(mrr.totalNok).toBe(228)
  })

  it('beregner aktiv MRR', () => {
    const mrr = computeActiveMrr([
      subscriber('active', 'solo', 'u1'),
      subscriber('active', 'solo', 'u2'),
      subscriber('active', 'family', 'u3'),
      subscriber('trialing', 'family', 'u4'),
    ])
    expect(mrr.solo.count).toBe(2)
    expect(mrr.family.count).toBe(1)
    expect(mrr.totalNok).toBe(317)
  })

  it('støtter flere statuser', () => {
    const mrr = computePlanMrrBreakdown(
      [subscriber('active', 'solo', 'u1'), subscriber('past_due', 'family', 'u2')],
      ['active', 'past_due'],
    )
    expect(mrr.totalNok).toBe(228)
  })
})

describe('scalePlanMrrToAnnual', () => {
  it('multipliserer beløp med 12', () => {
    const mrr = computeTrialPotentialMrr([
      subscriber('trialing', 'solo', 'u1'),
      subscriber('trialing', 'family', 'u2'),
    ])
    const arr = scalePlanMrrToAnnual(mrr)
    expect(arr.totalNok).toBe(mrr.totalNok * 12)
    expect(arr.solo.priceNok).toBe(89 * 12)
    expect(arr.solo.count).toBe(1)
  })
})

describe('formatAdminNok', () => {
  it('formaterer med tusenskille', () => {
    expect(formatAdminNok(2085)).toMatch(/2\s?085 kr/)
  })
})
