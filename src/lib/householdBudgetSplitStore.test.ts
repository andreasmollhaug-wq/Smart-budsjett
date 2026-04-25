import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { aggregateHouseholdData, useStore, type BudgetCategory } from './store'
import { resetStoreForLogout } from './store'

describe('addSharedHouseholdBudgetLine + aggregate', () => {
  beforeEach(() => {
    resetStoreForLogout()
    useStore.setState({ subscriptionPlan: 'family' })
    const r = useStore.getState().addProfile('B')
    if (!r.ok) {
      throw new Error(String(r))
    }
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('husholdningsaggregat sum per måned samsvarer med felles beløp (lik fordeling)', () => {
    const ids = useStore.getState().profiles.map((p) => p.id)
    const r = useStore.getState().addSharedHouseholdBudgetLine({
      name: 'Husleie',
      parentCategory: 'regninger',
      frequency: 'monthly',
      amount: 20_000,
      color: '#3B5BDB',
      participantProfileIds: [ids[0]!, ids[1]!],
      mode: 'equal',
    })
    expect(r.ok).toBe(true)
    const agg = aggregateHouseholdData(
      useStore.getState().people,
      ids,
      useStore.getState().budgetYear,
    )
    const line = agg.budgetCategories.find(
      (c) => c.name === 'Husleie' && c.parentCategory === 'regninger',
    ) as BudgetCategory | undefined
    expect(line).toBeDefined()
    if (!line) return
    for (let m = 0; m < 12; m++) {
      expect((line.budgeted[m] ?? 0) / 1).toBe(20_000)
    }
  })

  it('avviser felles kroner-linje når andelene ikke summerer til hovedbeløpet', () => {
    const ids = useStore.getState().profiles.map((p) => p.id)
    const r = useStore.getState().addSharedHouseholdBudgetLine({
      name: 'Dårlig sum',
      parentCategory: 'regninger',
      frequency: 'monthly',
      amount: 15_000,
      color: '#3B5BDB',
      participantProfileIds: [ids[0]!, ids[1]!],
      mode: 'amount',
      amountReferenceByProfileId: { [ids[0]!]: 10_000, [ids[1]!]: 4000 },
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toBe('validation')
  })
})
