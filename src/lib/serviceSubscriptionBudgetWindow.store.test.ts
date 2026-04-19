import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from './store'

/**
 * Integrasjon: addServiceSubscription med månedsvindu → Regninger-budsjett bygges korrekt.
 */
describe('addServiceSubscription budget month window', () => {
  beforeEach(() => {
    resetStoreForLogout()
    useStore.getState().setDemoDataEnabled(true)
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('legger kun planbeløp i valgte måneder (månedlig + synk)', () => {
    const year = useStore.getState().budgetYear
    const res = useStore.getState().addServiceSubscription({
      label: 'Vindu-test abo',
      amountNok: 50,
      billing: 'monthly',
      active: true,
      syncToBudget: true,
      budgetLinkMode: 'dedicated',
      budgetStartMonth1: 4,
      budgetEndMonth1: 6,
      plannedTransactions: null,
    })
    expect(res.ok).toBe(true)

    const person = useStore.getState().people[DEFAULT_PROFILE_ID]!
    const sub = person.serviceSubscriptions?.find((s) => s.label === 'Vindu-test abo')
    expect(sub?.budgetStartMonth1).toBe(4)
    expect(sub?.budgetEndMonth1).toBe(6)

    const cat = person.budgetCategories.find((c) => c.name.startsWith('Vindu-test abo'))
    expect(cat).toBeDefined()
    const b = cat!.budgeted
    expect(b.slice(0, 3).every((x) => x === 0)).toBe(true)
    expect(b[3]).toBe(50)
    expect(b[4]).toBe(50)
    expect(b[5]).toBe(50)
    expect(b.slice(6).every((x) => x === 0)).toBe(true)
    expect(year).toBeTypeOf('number')
  })

  it('årlig synk lagrer ikke månedsvindu-felter', () => {
    const res = useStore.getState().addServiceSubscription({
      label: 'Årlig test',
      amountNok: 1200,
      billing: 'yearly',
      active: true,
      syncToBudget: true,
      budgetLinkMode: 'dedicated',
      budgetStartMonth1: 3,
      budgetEndMonth1: 5,
      plannedTransactions: null,
    })
    expect(res.ok).toBe(true)
    const sub = useStore.getState().people[DEFAULT_PROFILE_ID]!.serviceSubscriptions?.find(
      (s) => s.label === 'Årlig test',
    )
    expect(sub?.budgetStartMonth1).toBeUndefined()
    expect(sub?.budgetEndMonth1).toBeUndefined()
  })
})
