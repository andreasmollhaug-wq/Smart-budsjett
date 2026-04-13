import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

describe('addDebt/updateDebt/removeDebt med budsjett-synk', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  afterEach(() => {
    resetStoreForLogout()
  })

  it('addDebt med sync oppretter gjeld-linje og 12 planlagte transaksjoner', () => {
    const year = useStore.getState().budgetYear
    useStore.getState().addDebt({
      id: 'debt-int-1',
      name: 'Integrasjonstest',
      totalAmount: 100_000,
      remainingAmount: 50_000,
      interestRate: 4,
      monthlyPayment: 1_500,
      type: 'consumer_loan',
      syncToBudget: true,
      syncPlannedTransactions: true,
      plannedPaymentDayOfMonth: 12,
      syncBudgetFromMonth1: 1,
    })
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    const debt = p.debts.find((d) => d.id === 'debt-int-1')
    expect(debt?.linkedBudgetCategoryId).toBeTruthy()
    expect(debt?.syncToBudget).toBe(true)
    const gjeldCat = p.budgetCategories.find((c) => c.id === debt?.linkedBudgetCategoryId)
    expect(gjeldCat?.parentCategory).toBe('gjeld')
    expect(gjeldCat?.budgeted.every((b) => b === 1500)).toBe(true)

    expect(debt?.syncBudgetFromMonth1).toBe(1)

    const planned = p.transactions.filter((t) => t.linkedDebtId === 'debt-int-1')
    expect(planned).toHaveLength(12)
    expect(planned[0]?.date).toBe(`${year}-01-12`)
    expect(planned[0]?.amount).toBe(1500)
    expect(planned.every((t) => t.category === gjeldCat?.name)).toBe(true)
  })

  it('addDebt med sync fra juni gir 7 planlagte trekk og nuller jan–mai i budsjett', () => {
    const year = useStore.getState().budgetYear
    useStore.getState().addDebt({
      id: 'debt-int-mid',
      name: 'Halvår',
      totalAmount: 60_000,
      remainingAmount: 30_000,
      interestRate: 4,
      monthlyPayment: 2_000,
      type: 'loan',
      syncToBudget: true,
      syncPlannedTransactions: true,
      plannedPaymentDayOfMonth: 1,
      syncBudgetFromMonth1: 6,
    })
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    const gjeldCat = p.budgetCategories.find((c) => c.name.includes('Halvår'))
    expect(gjeldCat?.budgeted.slice(0, 5).every((b) => b === 0)).toBe(true)
    expect(gjeldCat?.budgeted.slice(5).every((b) => b === 2000)).toBe(true)
    const planned = p.transactions.filter((t) => t.linkedDebtId === 'debt-int-mid')
    expect(planned).toHaveLength(7)
    expect(planned[0]?.date).toBe(`${year}-06-01`)
  })

  it('addDebt uten sync legger kun til gjeld uten ny budsjettlinje', () => {
    useStore.getState().addDebt({
      id: 'debt-int-2',
      name: 'Kun oversikt',
      totalAmount: 10_000,
      remainingAmount: 5_000,
      interestRate: 0,
      monthlyPayment: 500,
      type: 'other',
      syncToBudget: false,
    })
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(p.debts.some((d) => d.id === 'debt-int-2')).toBe(true)
    expect(p.budgetCategories.filter((c) => c.parentCategory === 'gjeld')).toHaveLength(0)
    expect(p.transactions.some((t) => t.linkedDebtId === 'debt-int-2')).toBe(false)
  })

  it('removeDebt fjerner koblet budsjett og planlagte transaksjoner', () => {
    useStore.getState().addDebt({
      id: 'debt-int-3',
      name: 'Slettes',
      totalAmount: 20_000,
      remainingAmount: 10_000,
      interestRate: 3,
      monthlyPayment: 800,
      type: 'loan',
      syncToBudget: true,
      syncPlannedTransactions: true,
      plannedPaymentDayOfMonth: 1,
      syncBudgetFromMonth1: 1,
    })
    useStore.getState().removeDebt('debt-int-3')
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(p.debts.some((d) => d.id === 'debt-int-3')).toBe(false)
    expect(p.transactions.some((t) => t.linkedDebtId === 'debt-int-3')).toBe(false)
    expect(p.budgetCategories.some((c) => c.name.includes('Slettes'))).toBe(false)
  })
})
