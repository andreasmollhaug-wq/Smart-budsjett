import { describe, expect, it } from 'vitest'
import {
  applyAdminSubscriberListDisplay,
  cycleAdminSubscriberRegisteredSort,
  filterAdminSubscribersByQuery,
  sortAdminSubscribersByRegistered,
} from '@/lib/admin/adminSubscriberListDisplay'
import type { AdminSubscriberEntry } from '@/lib/admin/types'

function entry(partial: Partial<AdminSubscriberEntry> & Pick<AdminSubscriberEntry, 'userId' | 'email'>): AdminSubscriberEntry {
  return {
    displayName: null,
    plan: 'solo',
    planLabel: 'Solo',
    status: 'active',
    statusLabel: 'Aktiv',
    hasStripeSubscription: true,
    registeredAt: null,
    registeredLabel: null,
    ...partial,
  }
}

const SAMPLE: AdminSubscriberEntry[] = [
  entry({
    userId: 'u1',
    email: 'anna@example.com',
    displayName: 'Anna Nord',
    registeredAt: '2024-01-10T00:00:00.000Z',
    registeredLabel: '10. jan. 2024',
  }),
  entry({
    userId: 'u2',
    email: 'bob@example.com',
    registeredAt: '2024-06-01T00:00:00.000Z',
    registeredLabel: '1. jun. 2024',
  }),
  entry({
    userId: 'u3',
    email: 'carl@example.com',
    displayName: 'Carl',
    registeredAt: null,
  }),
]

describe('filterAdminSubscribersByQuery', () => {
  it('filtrerer på e-post og visningsnavn', () => {
    expect(filterAdminSubscribersByQuery(SAMPLE, 'anna')).toHaveLength(1)
    expect(filterAdminSubscribersByQuery(SAMPLE, 'nord')[0]?.userId).toBe('u1')
    expect(filterAdminSubscribersByQuery(SAMPLE, 'bob@')).toHaveLength(1)
    expect(filterAdminSubscribersByQuery(SAMPLE, '')).toHaveLength(3)
  })
})

describe('sortAdminSubscribersByRegistered', () => {
  it('sorterer desc med ukjent dato sist', () => {
    const sorted = sortAdminSubscribersByRegistered(SAMPLE, 'desc')
    expect(sorted.map((s) => s.userId)).toEqual(['u2', 'u1', 'u3'])
  })

  it('sorterer asc med ukjent dato sist', () => {
    const sorted = sortAdminSubscribersByRegistered(SAMPLE, 'asc')
    expect(sorted.map((s) => s.userId)).toEqual(['u1', 'u2', 'u3'])
  })
})

describe('cycleAdminSubscriberRegisteredSort', () => {
  it('sykler null → desc → asc → null', () => {
    expect(cycleAdminSubscriberRegisteredSort(null)).toBe('desc')
    expect(cycleAdminSubscriberRegisteredSort('desc')).toBe('asc')
    expect(cycleAdminSubscriberRegisteredSort('asc')).toBe(null)
  })
})

describe('applyAdminSubscriberListDisplay', () => {
  it('kombinerer søk og sortering', () => {
    const list = applyAdminSubscriberListDisplay(SAMPLE, {
      query: 'bob',
      registeredSort: 'desc',
    })
    expect(list).toHaveLength(1)
    expect(list[0]?.userId).toBe('u2')
  })
})
