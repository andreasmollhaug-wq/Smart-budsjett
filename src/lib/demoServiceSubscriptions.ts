import type { ServiceSubscription, Transaction } from './store'
import { buildPlannedSubscriptionTransactions } from './subscriptionTransactions'

export const DEMO_SUB_ID_MOBIL = 'demo-sub-mobil'
export const DEMO_SUB_ID_STREAMING = 'demo-sub-streaming'
export const DEMO_SUB_ID_TRENING = 'demo-sub-trening'

export const DEMO_SUB_LINKED_CATEGORY = {
  mobil: 'demo-reg-4',
  streaming: 'demo-reg-6',
  trening: 'demo-reg-7',
} as const

/** Kategorinavn som i demo-budsjettet (sumTransaksjoner / planlagte trekk). */
export const DEMO_SUB_CATEGORY_NAMES = {
  mobil: 'Mobilabonnement',
  streaming: 'TV / streaming',
  trening: 'Treningsabonnement',
} as const

export type DemoSubscriptionAmounts = {
  mobil: number
  streaming: number
  trening: number
}

/** Indekser i `DEMO_MONTHLY_EXPENSES` / variant `expenseNames` som er tjenesteabonnement. */
export const DEMO_SUBSCRIPTION_EXPENSE_INDICES = [3, 5, 6] as const

export function demoExpenseIndexIsSubscription(ei: number): boolean {
  return ei === 3 || ei === 5 || ei === 6
}

/** Samme dag som tidligere `Math.min(3 + ei, 28)` for ei 3, 5, 6. */
function dayForSubscriptionExpenseIndex(ei: number): number {
  return Math.min(3 + ei, 28)
}

/**
 * Planlagte abonnementstrekk for hele budsjettåret (koblet til demo-sub-id-er).
 */
export function buildDemoSubscriptionPlannedTransactionsForYear(
  year: number,
  profileId: string,
  amounts: DemoSubscriptionAmounts,
): Transaction[] {
  const out: Transaction[] = []
  const triple: {
    id: string
    label: string
    categoryName: string
    amount: number
    expenseIndex: number
  }[] = [
    {
      id: DEMO_SUB_ID_MOBIL,
      label: DEMO_SUB_CATEGORY_NAMES.mobil,
      categoryName: DEMO_SUB_CATEGORY_NAMES.mobil,
      amount: amounts.mobil,
      expenseIndex: 3,
    },
    {
      id: DEMO_SUB_ID_STREAMING,
      label: 'Netflix',
      categoryName: DEMO_SUB_CATEGORY_NAMES.streaming,
      amount: amounts.streaming,
      expenseIndex: 5,
    },
    {
      id: DEMO_SUB_ID_TRENING,
      label: DEMO_SUB_CATEGORY_NAMES.trening,
      categoryName: DEMO_SUB_CATEGORY_NAMES.trening,
      amount: amounts.trening,
      expenseIndex: 6,
    },
  ]

  for (const row of triple) {
    out.push(
      ...buildPlannedSubscriptionTransactions({
        subscriptionId: row.id,
        label: row.label,
        categoryName: row.categoryName,
        profileId,
        amountNok: row.amount,
        billing: 'monthly',
        budgetYear: year,
        startMonth1: 1,
        endMonth1: 12,
        dayOfMonth: dayForSubscriptionExpenseIndex(row.expenseIndex),
      }),
    )
  }
  return out
}

export function buildDemoServiceSubscriptions(amounts: DemoSubscriptionAmounts): ServiceSubscription[] {
  return [
    {
      id: DEMO_SUB_ID_MOBIL,
      label: DEMO_SUB_CATEGORY_NAMES.mobil,
      amountNok: amounts.mobil,
      billing: 'monthly',
      active: true,
      syncToBudget: true,
      linkedBudgetCategoryId: DEMO_SUB_LINKED_CATEGORY.mobil,
      presetKey: 'annet',
    },
    {
      id: DEMO_SUB_ID_STREAMING,
      label: 'Netflix',
      amountNok: amounts.streaming,
      billing: 'monthly',
      active: true,
      syncToBudget: true,
      linkedBudgetCategoryId: DEMO_SUB_LINKED_CATEGORY.streaming,
      presetKey: 'netflix',
    },
    {
      id: DEMO_SUB_ID_TRENING,
      label: DEMO_SUB_CATEGORY_NAMES.trening,
      amountNok: amounts.trening,
      billing: 'monthly',
      active: true,
      syncToBudget: true,
      linkedBudgetCategoryId: DEMO_SUB_LINKED_CATEGORY.trening,
      presetKey: 'sats',
    },
  ]
}
