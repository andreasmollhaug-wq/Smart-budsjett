import { describe, expect, it } from 'vitest'
import { buildAdminMetrics, formatPulseDelta } from '@/lib/admin/buildAdminMetrics'
import type { AdminAuthUserSnapshot, AdminSubscriptionRow } from '@/lib/admin/types'

const nowMs = Date.parse('2026-06-03T12:00:00.000Z')

describe('buildAdminMetrics', () => {
  it('beregner funnel og konvertering', () => {
    const auth: AdminAuthUserSnapshot[] = [
      { createdAt: '2026-01-01T00:00:00.000Z', emailConfirmedAt: '2026-01-02T00:00:00.000Z' },
      { createdAt: '2026-02-01T00:00:00.000Z', emailConfirmedAt: null },
      { createdAt: '2026-03-01T00:00:00.000Z', emailConfirmedAt: '2026-03-01T00:00:00.000Z' },
    ]
    const subs: AdminSubscriptionRow[] = [
      {
        status: 'trialing',
        stripe_subscription_id: 'sub_1',
        first_checkout_at: '2026-01-05T00:00:00.000Z',
      },
      { status: 'active', stripe_subscription_id: 'sub_2', first_checkout_at: '2026-03-02T00:00:00.000Z' },
      { status: 'inactive', stripe_subscription_id: null, first_checkout_at: null },
    ]
    const m = buildAdminMetrics(auth, subs, nowMs)
    expect(m.funnel.registered).toBe(3)
    expect(m.funnel.emailConfirmed).toBe(2)
    expect(m.funnel.checkoutCompleted).toBe(2)
    expect(m.funnel.conversion.confirmedPctOfRegistered).toBe(66.7)
    expect(m.funnel.conversion.checkoutPctOfConfirmed).toBe(100)
    expect(m.subscription.trialing).toBe(1)
    expect(m.subscription.active).toBe(1)
    expect(m.weekly).toHaveLength(12)
    expect(m.daily).toHaveLength(30)
    expect(m.dailyTotals.registrations).toBeGreaterThanOrEqual(0)
  })

  it('pulse teller i dag og i går', () => {
    const auth: AdminAuthUserSnapshot[] = [
      { createdAt: '2026-06-03T08:00:00.000Z', emailConfirmedAt: '2026-06-03T09:00:00.000Z' },
      { createdAt: '2026-06-02T10:00:00.000Z', emailConfirmedAt: '2026-06-02T11:00:00.000Z' },
      { createdAt: '2026-06-01T10:00:00.000Z', emailConfirmedAt: null },
    ]
    const m = buildAdminMetrics(auth, [], nowMs)
    expect(m.pulse.registrations.today).toBe(1)
    expect(m.pulse.registrations.yesterday).toBe(1)
    expect(m.pulse.registrations.priorDay).toBe(1)
    expect(m.pulse.confirmed.today).toBe(1)
    expect(m.pulse.confirmed.yesterday).toBe(1)
  })
})

describe('formatPulseDelta', () => {
  it('viser retning', () => {
    expect(formatPulseDelta(3, 1)).toEqual({ sub: '+2 vs dagen før', trend: 'up' })
    expect(formatPulseDelta(1, 3)).toEqual({ sub: '-2 vs dagen før', trend: 'down' })
    expect(formatPulseDelta(2, 2)).toEqual({ sub: 'Samme som dagen før' })
    expect(formatPulseDelta(2, 1, 'hele gårsdagen')).toEqual({
      sub: '+1 vs hele gårsdagen',
      trend: 'up',
    })
  })
})
