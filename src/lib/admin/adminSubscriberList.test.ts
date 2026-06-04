import { describe, expect, it } from 'vitest'
import { buildAdminSubscriberList, planLabelForAdmin } from '@/lib/admin/adminSubscriberList'
import type { AdminAuthUserDirectoryEntry, AdminSubscriptionDetailRow } from '@/lib/admin/types'

describe('buildAdminSubscriberList', () => {
  const directory = new Map<string, AdminAuthUserDirectoryEntry>([
    ['u1', { email: 'anna@example.com', displayName: 'Anna' }],
    ['u2', { email: 'bob@example.com', displayName: null }],
    ['u3', { email: 'carl@example.com', displayName: 'Carl' }],
  ])

  it('inkluderer aktive statuser med plan', () => {
    const rows: AdminSubscriptionDetailRow[] = [
      {
        user_id: 'u1',
        status: 'active',
        stripe_subscription_id: 'sub_1',
        first_checkout_at: null,
        plan: 'solo',
      },
      {
        user_id: 'u2',
        status: 'trialing',
        stripe_subscription_id: 'sub_2',
        first_checkout_at: null,
        plan: 'family',
      },
      {
        user_id: 'u3',
        status: 'canceled',
        stripe_subscription_id: 'sub_3',
        first_checkout_at: null,
        plan: 'solo',
      },
    ]
    const list = buildAdminSubscriberList(directory, rows)
    expect(list).toHaveLength(2)
    expect(list[0].email).toBe('anna@example.com')
    expect(list[0].planLabel).toBe('Solo')
    expect(list[1].planLabel).toBe('Familie')
  })

  it('inkluderer legacy_grandfathered', () => {
    const rows: AdminSubscriptionDetailRow[] = [
      {
        user_id: 'u1',
        status: 'legacy_grandfathered',
        stripe_subscription_id: null,
        first_checkout_at: null,
        plan: null,
      },
    ]
    const list = buildAdminSubscriberList(directory, rows)
    expect(list).toHaveLength(1)
    expect(list[0].planLabel).toBe('Ukjent plan')
    expect(list[0].statusLabel).toBe('Bestefar')
  })
})

describe('planLabelForAdmin', () => {
  it('mapper plan', () => {
    expect(planLabelForAdmin('solo')).toBe('Solo')
    expect(planLabelForAdmin('family')).toBe('Familie')
    expect(planLabelForAdmin(null)).toBe('Ukjent plan')
  })
})
