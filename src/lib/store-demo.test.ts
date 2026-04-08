import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createDemoPersonDataForProfile,
  DEFAULT_PROFILE_ID,
  getDemoVariantIndexForProfile,
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

describe('demo varianter familie', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('getDemoVariantIndexForProfile: solo eller én profil gir alltid 0', () => {
    expect(getDemoVariantIndexForProfile('solo', 1, 0)).toBe(0)
    expect(getDemoVariantIndexForProfile('family', 1, 0)).toBe(0)
  })

  it('getDemoVariantIndexForProfile: familie med flere følger indeks opp til 4', () => {
    expect(getDemoVariantIndexForProfile('family', 3, 0)).toBe(0)
    expect(getDemoVariantIndexForProfile('family', 3, 1)).toBe(1)
    expect(getDemoVariantIndexForProfile('family', 3, 2)).toBe(2)
    expect(getDemoVariantIndexForProfile('family', 6, 5)).toBe(4)
  })

  it('createDemoPersonDataForProfile: variant 0 og 1 har ulik årlig lønnsum (transaksjoner)', () => {
    const year = 2026
    const a = createDemoPersonDataForProfile('p1', year, 0)
    const b = createDemoPersonDataForProfile('p2', year, 1)
    const sumIncome = (p: typeof a) =>
      p.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    expect(sumIncome(a)).toBe(11 * 50_000 + 80_000)
    expect(sumIncome(b)).toBe(11 * 28_000 + 42_000)
    expect(sumIncome(a)).not.toBe(sumIncome(b))
  })

  it('setDemoDataEnabled med to familieprofiler gir ulike demodata per person', () => {
    useStore.setState({ subscriptionPlan: 'family' })
    const r = useStore.getState().addProfile('Partner')
    if (!r.ok) throw new Error('addProfile')
    useStore.getState().setDemoDataEnabled(true)
    const ids = useStore.getState().profiles.map((p) => p.id)
    const p0 = useStore.getState().people[ids[0]!]!
    const p1 = useStore.getState().people[ids[1]!]!
    const sumIncome = (p: typeof p0) =>
      p.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    expect(sumIncome(p0)).toBe(11 * 50_000 + 80_000)
    expect(sumIncome(p1)).toBe(11 * 28_000 + 42_000)
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

describe('addTransaction profileId routing', () => {
  beforeEach(() => {
    resetStoreForLogout()
    useStore.setState({ subscriptionPlan: 'family' })
    const r = useStore.getState().addProfile('Partner')
    if (!r.ok) throw new Error('addProfile failed')
    useStore.getState().setActiveProfileId(DEFAULT_PROFILE_ID)
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('legger transaksjon på valgt profil når profileId er satt og aktiv er en annen', () => {
    const partnerId = useStore.getState().profiles.find((p) => p.id !== DEFAULT_PROFILE_ID)!.id
    useStore.getState().addTransaction({
      id: 'tx-on-partner',
      date: '2026-03-01',
      description: 'Delt',
      amount: 50,
      category: 'Mat',
      type: 'expense',
      profileId: partnerId,
    })
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions).toHaveLength(0)
    const partnerTxs = useStore.getState().people[partnerId]!.transactions
    expect(partnerTxs).toHaveLength(1)
    expect(partnerTxs[0]!.id).toBe('tx-on-partner')
    expect(partnerTxs[0]!.profileId).toBe(partnerId)
  })

  it('addTransactions med samme profileId som ikke er aktiv prepender til riktig profil', () => {
    const partnerId = useStore.getState().profiles.find((p) => p.id !== DEFAULT_PROFILE_ID)!.id
    useStore.getState().addTransactions([
      {
        id: 'tx-1',
        date: '2026-01-10',
        description: 'a',
        amount: 10,
        category: 'Mat',
        type: 'expense',
        profileId: partnerId,
      },
      {
        id: 'tx-2',
        date: '2026-02-10',
        description: 'b',
        amount: 20,
        category: 'Mat',
        type: 'expense',
        profileId: partnerId,
      },
    ])
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions).toHaveLength(0)
    const ids = useStore.getState().people[partnerId]!.transactions.map((t) => t.id).sort()
    expect(ids).toEqual(['tx-1', 'tx-2'].sort())
  })
})
