import { describe, expect, it } from 'vitest'
import { createEmptyPersonData, type BudgetCategory, type ServiceSubscription } from '@/lib/store'
import {
  applySubscriptionBudgetRebuildsForYear,
  isSubscriptionContributingInBudgetMonth,
  rebuildRegningerCategoryBudgetFromSubscriptions,
  subscriptionBudgetContributionForMonth,
  subscriptionRollupContributionForMonth,
} from './subscriptionBudgetRebuild'

function regCat(id: string, name: string): BudgetCategory {
  return {
    id,
    name,
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    color: '#000',
    parentCategory: 'regninger',
    frequency: 'monthly',
  }
}

describe('isSubscriptionContributingInBudgetMonth', () => {
  it('avsluttet med active false: måneder før avslutning teller i avslutningsår', () => {
    const sub = {
      id: '1',
      label: 'X',
      amountNok: 100,
      billing: 'monthly' as const,
      active: false,
      syncToBudget: true,
      linkedBudgetCategoryId: 'c1',
      cancelledFrom: { year: 2026, month: 6 },
    } satisfies ServiceSubscription
    expect(isSubscriptionContributingInBudgetMonth(sub, 2026, 0)).toBe(true)
    expect(isSubscriptionContributingInBudgetMonth(sub, 2026, 4)).toBe(true)
    expect(isSubscriptionContributingInBudgetMonth(sub, 2026, 5)).toBe(false)
  })
})

describe('rebuildRegningerCategoryBudgetFromSubscriptions', () => {
  it('to månedlige på samme kategori summeres', () => {
    const cat = regCat('c1', 'Streaming')
    const person = {
      ...createEmptyPersonData(),
      budgetCategories: [cat],
      serviceSubscriptions: [
        {
          id: 'a',
          label: 'A',
          amountNok: 100,
          billing: 'monthly' as const,
          active: true,
          syncToBudget: true,
          linkedBudgetCategoryId: 'c1',
          budgetLinkMode: 'shared' as const,
        },
        {
          id: 'b',
          label: 'B',
          amountNok: 50,
          billing: 'monthly' as const,
          active: true,
          syncToBudget: true,
          linkedBudgetCategoryId: 'c1',
          budgetLinkMode: 'shared' as const,
        },
      ],
    }
    const b = rebuildRegningerCategoryBudgetFromSubscriptions(person, 2026, 'c1')
    expect(b.every((x) => x === 150)).toBe(true)
  })

  it('årlig med forfall kun i mars: fullt beløp i mars', () => {
    const cat = regCat('c1', 'Forsikring')
    const person = {
      ...createEmptyPersonData(),
      budgetCategories: [cat],
      serviceSubscriptions: [
        {
          id: 'a',
          label: 'F',
          amountNok: 1200,
          billing: 'yearly' as const,
          active: true,
          syncToBudget: true,
          linkedBudgetCategoryId: 'c1',
          yearlyChargeMonth1: 3,
        },
      ],
    }
    const b = rebuildRegningerCategoryBudgetFromSubscriptions(person, 2026, 'c1')
    expect(b[0]).toBe(0)
    expect(b[1]).toBe(0)
    expect(b[2]).toBe(1200)
    expect(b[3]).toBe(0)
  })
})

describe('subscriptionRollupContributionForMonth vs subscriptionBudgetContributionForMonth', () => {
  it('rollup uten synk viser fortsatt kostnad', () => {
    const sub: ServiceSubscription = {
      id: '1',
      label: 'X',
      amountNok: 300,
      billing: 'monthly',
      active: true,
      syncToBudget: false,
    }
    expect(subscriptionRollupContributionForMonth(sub, 2026, 0)).toBe(300)
    expect(subscriptionBudgetContributionForMonth(sub, 2026, 0)).toBe(0)
  })
})

describe('applySubscriptionBudgetRebuildsForYear', () => {
  it('oppdaterer kategori fra avsluttet abonnement (delt logikk)', () => {
    const cat = regCat('cat-1', 'Netflix')
    const person = {
      ...createEmptyPersonData(),
      budgetCategories: [{ ...cat, budgeted: Array(12).fill(200) }],
      serviceSubscriptions: [
        {
          id: 's1',
          label: 'Netflix',
          amountNok: 200,
          billing: 'monthly' as const,
          active: false,
          syncToBudget: true,
          linkedBudgetCategoryId: 'cat-1',
          cancelledFrom: { year: 2026, month: 6 },
        },
      ],
    }
    const next = applySubscriptionBudgetRebuildsForYear(person, 2026)
    const b = next.budgetCategories[0]!.budgeted
    expect(b.slice(0, 5).every((x) => x === 200)).toBe(true)
    expect(b.slice(5).every((x) => x === 0)).toBe(true)
  })
})
