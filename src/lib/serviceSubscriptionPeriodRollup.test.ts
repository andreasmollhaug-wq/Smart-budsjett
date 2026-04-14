import { describe, expect, it } from 'vitest'
import {
  buildServiceSubscriptionMonthlyCostForPeriod,
  isServiceSubscriptionActiveInMonth,
  rollupServiceSubscriptionsCostForPeriod,
} from './serviceSubscriptionPeriodRollup'
import type { ServiceSubscription } from './store'

function sub(p: Partial<ServiceSubscription> & Pick<ServiceSubscription, 'id' | 'amountNok' | 'billing' | 'active'>): ServiceSubscription {
  return {
    label: 'T',
    syncToBudget: false,
    ...p,
  } as ServiceSubscription
}

describe('isServiceSubscriptionActiveInMonth', () => {
  it('aktiv uten cancelledFrom i alle måneder', () => {
    const s = sub({ id: '1', amountNok: 100, billing: 'monthly', active: true })
    expect(isServiceSubscriptionActiveInMonth(s, 2026, 0)).toBe(true)
    expect(isServiceSubscriptionActiveInMonth(s, 2026, 11)).toBe(true)
  })

  it('inaktiv', () => {
    const s = sub({ id: '1', amountNok: 100, billing: 'monthly', active: false })
    expect(isServiceSubscriptionActiveInMonth(s, 2026, 0)).toBe(false)
  })

  it('avsluttet fra mars: jan og feb aktive i samme år', () => {
    const s = sub({
      id: '1',
      amountNok: 1200,
      billing: 'monthly',
      active: true,
      cancelledFrom: { year: 2026, month: 3 },
    })
    expect(isServiceSubscriptionActiveInMonth(s, 2026, 0)).toBe(true)
    expect(isServiceSubscriptionActiveInMonth(s, 2026, 1)).toBe(true)
    expect(isServiceSubscriptionActiveInMonth(s, 2026, 2)).toBe(false)
  })
})

describe('rollupServiceSubscriptionsCostForPeriod', () => {
  it('én månedlig i én måned', () => {
    const s = sub({ id: 'a', amountNok: 300, billing: 'monthly', active: true })
    const r = rollupServiceSubscriptionsCostForPeriod([s], 2026, 2, 2)
    expect(r.totalNok).toBe(300)
    expect(r.uniqueIdsInPeriod).toBe(1)
  })

  it('årlig fordelt på to måneder', () => {
    const s = sub({ id: 'a', amountNok: 1200, billing: 'yearly', active: true })
    const r = rollupServiceSubscriptionsCostForPeriod([s], 2026, 0, 1)
    expect(r.totalNok).toBeCloseTo((1200 / 12) * 2, 5)
    expect(r.uniqueIdsInPeriod).toBe(1)
  })

  it('to unike abo i samme måned', () => {
    const a = sub({ id: '1', amountNok: 100, billing: 'monthly', active: true })
    const b = sub({ id: '2', amountNok: 50, billing: 'monthly', active: true })
    const r = rollupServiceSubscriptionsCostForPeriod([a, b], 2026, 5, 5)
    expect(r.totalNok).toBe(150)
    expect(r.uniqueIdsInPeriod).toBe(2)
  })
})

describe('buildServiceSubscriptionMonthlyCostForPeriod', () => {
  it('sum av måneder samsvarer med rollup for samme periode', () => {
    const a = sub({ id: '1', amountNok: 100, billing: 'monthly', active: true })
    const b = sub({ id: '2', amountNok: 1200, billing: 'yearly', active: true })
    const start = 0
    const end = 2
    const monthly = buildServiceSubscriptionMonthlyCostForPeriod([a, b], 2026, start, end)
    expect(monthly).toHaveLength(3)
    const sumMonthly = monthly.reduce((s, m) => s + m.costNok, 0)
    const rollup = rollupServiceSubscriptionsCostForPeriod([a, b], 2026, start, end)
    expect(sumMonthly).toBeCloseTo(rollup.totalNok, 5)
  })
})
