import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createDemoPersonDataForProfile,
  DEFAULT_PROFILE_ID,
  resetStoreForLogout,
  useStore,
} from './store'

describe('setDemoDataEnabled', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('fjerner demodata når demo slås av uten backup (peopleBeforeDemo mangler)', () => {
    useStore.getState().setDemoDataEnabled(true)
    expect(useStore.getState().demoDataEnabled).toBe(true)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.budgetCategories.length).toBeGreaterThan(0)

    useStore.setState({ peopleBeforeDemo: null })

    useStore.getState().setDemoDataEnabled(false)
    expect(useStore.getState().demoDataEnabled).toBe(false)
    const person = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(person.budgetCategories).toHaveLength(0)
    expect(person.transactions).toHaveLength(0)
    expect(person.savingsGoals).toHaveLength(0)
    expect(person.debts).toHaveLength(0)
    expect(person.investments).toHaveLength(0)
  })

  it('fjerner demodata når backup kun inneholder demo (ugyldig gjenoppretting)', () => {
    const year = useStore.getState().budgetYear
    const demo = createDemoPersonDataForProfile(DEFAULT_PROFILE_ID, year)
    useStore.setState({
      demoDataEnabled: true,
      people: { [DEFAULT_PROFILE_ID]: demo },
      peopleBeforeDemo: { [DEFAULT_PROFILE_ID]: demo },
    })

    useStore.getState().setDemoDataEnabled(false)
    expect(useStore.getState().demoDataEnabled).toBe(false)
    const person = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(person.budgetCategories).toHaveLength(0)
    expect(person.transactions).toHaveLength(0)
  })
})

describe('addTransactions', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('prepender alle transaksjoner i én oppdatering', () => {
    useStore.getState().addTransactions([
      { id: 'tx-a', date: '2026-01-10', description: 'Lønn', amount: 40_000, category: 'Lønn', type: 'income' },
      { id: 'tx-b', date: '2026-02-10', description: 'Lønn', amount: 40_000, category: 'Lønn', type: 'income' },
    ])
    const txs = useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions
    expect(txs).toHaveLength(2)
    expect(txs.map((t) => t.id).sort()).toEqual(['tx-a', 'tx-b'].sort())
  })

  it('ingen endring ved tom liste', () => {
    useStore.getState().addTransaction({
      id: 'solo',
      date: '2026-01-01',
      description: 'x',
      amount: 1,
      category: 'x',
      type: 'expense',
    })
    useStore.getState().addTransactions([])
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions).toHaveLength(1)
  })
})
