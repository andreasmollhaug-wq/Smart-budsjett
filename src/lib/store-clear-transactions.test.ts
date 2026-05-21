import { beforeEach, describe, expect, it } from 'vitest'
import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import {
  createEmptyPersonData,
  DEFAULT_PROFILE_ID,
  resetStoreForLogout,
  useStore,
} from '@/lib/store'

function matCategory(spent = 0): BudgetCategory {
  return {
    id: 'cat-mat',
    name: 'Mat',
    parentCategory: 'utgifter',
    type: 'expense',
    color: '#000',
    frequency: 'monthly',
    budgeted: Array.from({ length: 12 }, () => 5000),
    spent,
  }
}

function spareCategory(): BudgetCategory {
  return {
    id: 'cat-spare',
    name: 'Buffer',
    parentCategory: 'sparing',
    type: 'expense',
    color: '#0CA678',
    frequency: 'monthly',
    budgeted: Array.from({ length: 12 }, () => 1000),
    spent: 0,
  }
}

function sampleTx(id: string, profileId: string, amount = 100): Transaction {
  return {
    id,
    date: '2026-03-15',
    description: 'Test',
    amount,
    category: 'Mat',
    type: 'expense',
    profileId,
  }
}

describe('clearAllTransactionsForProfile', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('sletter alle transaksjoner og returnerer removedCount', () => {
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      people: {
        [DEFAULT_PROFILE_ID]: {
          ...p,
          budgetCategories: [matCategory(250)],
          transactions: [sampleTx('tx-1', DEFAULT_PROFILE_ID), sampleTx('tx-2', DEFAULT_PROFILE_ID, 150)],
        },
      },
    })

    const res = useStore.getState().clearAllTransactionsForProfile(DEFAULT_PROFILE_ID)
    expect(res).toEqual({ ok: true, removedCount: 2 })

    const person = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(person.transactions).toHaveLength(0)
    expect(person.budgetCategories.find((c) => c.name === 'Mat')?.spent).toBe(0)
  })

  it('oppdaterer currentAmount på koblet sparemål', () => {
    const spareCat = spareCategory()
    const goal: SavingsGoal = {
      id: 'goal-1',
      name: 'Buffer',
      targetAmount: 10_000,
      currentAmount: 500,
      targetDate: '2027-12-31',
      color: '#0CA678',
      linkedBudgetCategoryId: spareCat.id,
      baselineAmount: 200,
    }
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      people: {
        [DEFAULT_PROFILE_ID]: {
          ...p,
          budgetCategories: [spareCat],
          savingsGoals: [goal],
          transactions: [
            {
              id: 'tx-spare',
              date: '2026-02-01',
              description: 'Innskudd',
              amount: 300,
              category: 'Buffer',
              type: 'expense',
              profileId: DEFAULT_PROFILE_ID,
            },
          ],
        },
      },
    })

    const res = useStore.getState().clearAllTransactionsForProfile(DEFAULT_PROFILE_ID)
    expect(res.ok).toBe(true)

    const updatedGoal = useStore.getState().people[DEFAULT_PROFILE_ID]!.savingsGoals[0]!
    expect(updatedGoal.currentAmount).toBe(200)
  })

  it('returnerer empty når profilen ikke har transaksjoner', () => {
    expect(useStore.getState().clearAllTransactionsForProfile(DEFAULT_PROFILE_ID)).toEqual({
      ok: false,
      reason: 'empty',
    })
  })

  it('returnerer unknown_profile for ukjent profil', () => {
    expect(useStore.getState().clearAllTransactionsForProfile('finnes-ikke')).toEqual({
      ok: false,
      reason: 'unknown_profile',
    })
  })

  it('lar andre profiler beholde transaksjoner', () => {
    const extraId = 'partner-1'
    const empty = createEmptyPersonData()
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Meg' },
        { id: extraId, name: 'Partner' },
      ],
      people: {
        [DEFAULT_PROFILE_ID]: {
          ...empty,
          budgetCategories: [matCategory()],
          transactions: [sampleTx('tx-me', DEFAULT_PROFILE_ID)],
        },
        [extraId]: {
          ...empty,
          budgetCategories: [matCategory()],
          transactions: [sampleTx('tx-partner', extraId, 200)],
        },
      },
    })

    const res = useStore.getState().clearAllTransactionsForProfile(DEFAULT_PROFILE_ID)
    expect(res).toEqual({ ok: true, removedCount: 1 })

    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions).toHaveLength(0)
    expect(useStore.getState().people[extraId]!.transactions).toHaveLength(1)
    expect(useStore.getState().people[extraId]!.transactions[0]!.id).toBe('tx-partner')
  })

  it('beholder budsjettplan og gjeld urørt', () => {
    const p = createEmptyPersonData()
    p.budgetCategories = [matCategory()]
    p.debts = [
      {
        id: 'debt-1',
        name: 'Forbrukslån',
        totalAmount: 50_000,
        remainingAmount: 40_000,
        interestRate: 8,
        monthlyPayment: 2000,
        type: 'consumer_loan',
      },
    ]
    p.transactions = [sampleTx('tx-1', DEFAULT_PROFILE_ID)]

    useStore.setState({
      people: { [DEFAULT_PROFILE_ID]: p },
    })

    useStore.getState().clearAllTransactionsForProfile(DEFAULT_PROFILE_ID)

    const person = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(person.budgetCategories[0]!.budgeted[0]).toBe(5000)
    expect(person.debts).toHaveLength(1)
    expect(person.debts[0]!.name).toBe('Forbrukslån')
  })
})
