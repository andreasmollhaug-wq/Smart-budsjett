import { generateId } from './utils'
import { emptyLabelLists } from './budgetCategoryCatalog'
import type { ParentCategory } from './budgetCategoryCatalog'
import type {
  BudgetCategory,
  Debt,
  Investment,
  PersonData,
  SavingsGoal,
  Transaction,
} from './store'
import type { SubscriptionPlan } from './store'
import {
  buildDemoSubscriptionPlannedTransactionsForYear,
  demoExpenseIndexIsSubscription,
  type DemoSubscriptionAmounts,
} from './demoServiceSubscriptions'

/** Maks indeks for forhåndsdefinert demoprofil (0 = dagens solo/første medlem). */
export const MAX_DEMO_VARIANT_INDEX = 4

export function getDemoVariantIndexForProfile(
  subscriptionPlan: SubscriptionPlan,
  profileCount: number,
  profileIndex: number,
): number {
  if (subscriptionPlan !== 'family' || profileCount <= 1) return 0
  return Math.min(Math.max(profileIndex, 0), MAX_DEMO_VARIANT_INDEX)
}

export type DemoIncomePattern = {
  salaryMonthly: number
  /** Måned med ferie-/bonusinntekt (0 = jan, 5 = juni) — ingen vanlig lønn den måneden. */
  bonusMonthIndex: number
  bonusIncome: number
}

type DemoVariantBody = {
  income: DemoIncomePattern
  /** Samme rekkefølge som demoutgifter i store (21 linjer). */
  monthlyExpenses: readonly number[]
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  investments: Investment[]
}

const frequency = 'monthly' as const

function buildBudgetCategoriesFromVariant(body: DemoVariantBody): BudgetCategory[] {
  const { income, monthlyExpenses } = body
  const lønnBudgeted = Array.from({ length: 12 }, (_, i) =>
    i === income.bonusMonthIndex ? 0 : income.salaryMonthly,
  )
  const ferieBudgeted = Array.from({ length: 12 }, (_, i) =>
    i === income.bonusMonthIndex ? income.bonusIncome : 0,
  )

  const incomeRows: BudgetCategory[] = [
    {
      id: 'demo-innt-1',
      name: 'Lønn',
      budgeted: lønnBudgeted,
      spent: income.salaryMonthly,
      type: 'income',
      color: '#0CA678',
      parentCategory: 'inntekter',
      frequency,
    },
    {
      id: 'demo-innt-2',
      name: 'Feriepenger',
      budgeted: ferieBudgeted,
      spent: 0,
      type: 'income',
      color: '#3B5BDB',
      parentCategory: 'inntekter',
      frequency,
    },
  ]

  const expenseMeta: { id: string; name: string; parent: ParentCategory; color: string }[] = [
    { id: 'demo-reg-1', name: 'Husleie', parent: 'regninger', color: '#3B5BDB' },
    { id: 'demo-reg-2', name: 'Strøm', parent: 'regninger', color: '#4C6EF5' },
    { id: 'demo-reg-3', name: 'Internett', parent: 'regninger', color: '#4C6EF5' },
    { id: 'demo-reg-4', name: 'Mobilabonnement', parent: 'regninger', color: '#AE3EC9' },
    { id: 'demo-reg-5', name: 'Innboforsikring', parent: 'regninger', color: '#7048E8' },
    { id: 'demo-reg-6', name: 'TV / streaming', parent: 'regninger', color: '#E03131' },
    { id: 'demo-reg-7', name: 'Treningsabonnement', parent: 'regninger', color: '#F08C00' },
    { id: 'demo-utg-1', name: 'Mat & dagligvarer', parent: 'utgifter', color: '#7048E8' },
    { id: 'demo-utg-2', name: 'Transport', parent: 'utgifter', color: '#4C6EF5' },
    { id: 'demo-utg-3', name: 'Restaurant & takeaway', parent: 'utgifter', color: '#E03131' },
    { id: 'demo-utg-4', name: 'Klær & sko', parent: 'utgifter', color: '#AE3EC9' },
    { id: 'demo-utg-5', name: 'Apotek & helse', parent: 'utgifter', color: '#0B7285' },
    { id: 'demo-utg-6', name: 'Fritid & hobby', parent: 'utgifter', color: '#3B5BDB' },
    { id: 'demo-utg-7', name: 'Diverse', parent: 'utgifter', color: '#0CA678' },
    { id: 'demo-gjeld-1', name: 'Boliglån (avdrag)', parent: 'gjeld', color: '#3B5BDB' },
    { id: 'demo-gjeld-2', name: 'Studielån', parent: 'gjeld', color: '#4C6EF5' },
    { id: 'demo-gjeld-3', name: 'Kredittkort', parent: 'gjeld', color: '#E03131' },
    { id: 'demo-spar-1', name: 'Fond', parent: 'sparing', color: '#0CA678' },
    { id: 'demo-spar-2', name: 'Aksjer', parent: 'sparing', color: '#3B5BDB' },
    { id: 'demo-spar-3', name: 'BSU', parent: 'sparing', color: '#7048E8' },
    { id: 'demo-spar-4', name: 'Nødfond', parent: 'sparing', color: '#F08C00' },
  ]

  if (monthlyExpenses.length !== expenseMeta.length) {
    throw new Error(`demo variant: forventet ${expenseMeta.length} utgiftsbeløp, fikk ${monthlyExpenses.length}`)
  }

  const expenseRows: BudgetCategory[] = expenseMeta.map((m, i) => {
    const monthly = monthlyExpenses[i] ?? 0
    return {
      id: m.id,
      name: m.name,
      budgeted: Array(12).fill(monthly),
      spent: monthly,
      type: 'expense',
      color: m.color,
      parentCategory: m.parent,
      frequency,
    }
  })

  return [...incomeRows, ...expenseRows]
}

function buildDemoTransactionsForVariantBody(
  year: number,
  profileId: string,
  body: DemoVariantBody,
): Transaction[] {
  const txs: Transaction[] = []
  const { income, monthlyExpenses } = body
  const expenseNames = [
    'Husleie',
    'Strøm',
    'Internett',
    'Mobilabonnement',
    'Innboforsikring',
    'TV / streaming',
    'Treningsabonnement',
    'Mat & dagligvarer',
    'Transport',
    'Restaurant & takeaway',
    'Klær & sko',
    'Apotek & helse',
    'Fritid & hobby',
    'Diverse',
    'Boliglån (avdrag)',
    'Studielån',
    'Kredittkort',
    'Fond',
    'Aksjer',
    'BSU',
    'Nødfond',
  ] as const

  for (let mi = 0; mi < 12; mi++) {
    const ym = `${year}-${String(mi + 1).padStart(2, '0')}`
    if (mi === income.bonusMonthIndex) {
      txs.push({
        id: generateId(),
        date: `${ym}-12`,
        description: 'Feriepenger',
        amount: income.bonusIncome,
        category: 'Feriepenger',
        type: 'income',
        profileId,
      })
    } else {
      txs.push({
        id: generateId(),
        date: `${ym}-25`,
        description: 'Lønn',
        amount: income.salaryMonthly,
        category: 'Lønn',
        type: 'income',
        profileId,
      })
    }
    for (let ei = 0; ei < expenseNames.length; ei++) {
      if (demoExpenseIndexIsSubscription(ei)) continue
      const name = expenseNames[ei]!
      const amt = monthlyExpenses[ei] ?? 0
      const day = Math.min(3 + ei, 28)
      txs.push({
        id: generateId(),
        date: `${ym}-${String(day).padStart(2, '0')}`,
        description: name,
        amount: amt,
        category: name,
        type: 'expense',
        profileId,
      })
    }
  }
  const subAmounts: DemoSubscriptionAmounts = {
    mobil: monthlyExpenses[3] ?? 0,
    streaming: monthlyExpenses[5] ?? 0,
    trening: monthlyExpenses[6] ?? 0,
  }
  txs.push(...buildDemoSubscriptionPlannedTransactionsForYear(year, profileId, subAmounts))
  txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return txs
}

/** Variant 1 — lavere inntekt, strammere hverdag (f.eks. student/ tidlig karriere). */
const VARIANT_1: DemoVariantBody = {
  income: { salaryMonthly: 28_000, bonusMonthIndex: 5, bonusIncome: 42_000 },
  monthlyExpenses: [
    5_800, 650, 350, 220, 140, 180, 229, 5_200, 1_100, 480, 280, 180, 450, 550, 1_200, 2_600, 350, 400, 250, 1_500, 300,
  ],
  savingsGoals: [
    {
      id: '1',
      name: 'Feriefond',
      targetAmount: 14_000,
      currentAmount: 4_200,
      targetDate: '2026-07-01',
      color: '#3B5BDB',
      linkedBudgetCategoryId: 'demo-spar-1',
    },
    {
      id: '2',
      name: 'Nødfond',
      targetAmount: 35_000,
      currentAmount: 9_500,
      targetDate: '2026-12-01',
      color: '#0CA678',
      linkedBudgetCategoryId: 'demo-spar-4',
    },
    {
      id: '3',
      name: 'Kontantinsats',
      targetAmount: 120_000,
      currentAmount: 18_000,
      targetDate: '2027-06-01',
      color: '#F08C00',
      linkedBudgetCategoryId: 'demo-spar-2',
    },
  ],
  debts: [
    {
      id: '1',
      name: 'Boliglån',
      totalAmount: 1_800_000,
      remainingAmount: 1_650_000,
      interestRate: 5.4,
      monthlyPayment: 1_200,
      type: 'mortgage',
      includeInSnowball: false,
    },
    {
      id: '2',
      name: 'Studielån',
      totalAmount: 245_000,
      remainingAmount: 198_000,
      interestRate: 4.5,
      monthlyPayment: 2_600,
      type: 'student_loan',
      includeInSnowball: true,
    },
    {
      id: '3',
      name: 'Kredittkort',
      totalAmount: 14_000,
      remainingAmount: 4_800,
      interestRate: 21.9,
      monthlyPayment: 350,
      type: 'credit_card',
      includeInSnowball: true,
    },
  ],
  investments: [
    {
      id: '1',
      name: 'Indeksfond lav risiko',
      type: 'funds',
      purchaseValue: 18_000,
      currentValue: 18_900,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 18_400 },
        { date: '2026-03-02', value: 18_700 },
        { date: '2026-03-09', value: 18_900 },
      ],
    },
    {
      id: '2',
      name: 'Grønne aksjer',
      type: 'stocks',
      purchaseValue: 8_500,
      currentValue: 9_200,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 8_800 },
        { date: '2026-03-02', value: 9_000 },
        { date: '2026-03-09', value: 9_200 },
      ],
    },
  ],
}

/** Variant 2 — høyere inntekt og høyere forbruk. */
const VARIANT_2: DemoVariantBody = {
  income: { salaryMonthly: 68_000, bonusMonthIndex: 5, bonusIncome: 95_000 },
  monthlyExpenses: [
    9_850, 1_800, 650, 550, 320, 480, 599, 11_200, 3_800, 2_200, 1_400, 550, 1_600, 1_400, 16_000, 2_200, 1_800, 4_200, 2_800, 2_500, 1_200,
  ],
  savingsGoals: [
    {
      id: '1',
      name: 'Feriefond',
      targetAmount: 85_000,
      currentAmount: 52_000,
      targetDate: '2026-07-01',
      color: '#3B5BDB',
      linkedBudgetCategoryId: 'demo-spar-1',
    },
    {
      id: '2',
      name: 'Nødfond',
      targetAmount: 250_000,
      currentAmount: 142_000,
      targetDate: '2026-12-01',
      color: '#0CA678',
      linkedBudgetCategoryId: 'demo-spar-4',
    },
    {
      id: '3',
      name: 'Hyttedrøm',
      targetAmount: 450_000,
      currentAmount: 195_000,
      targetDate: '2028-06-01',
      color: '#F08C00',
      linkedBudgetCategoryId: 'demo-spar-2',
    },
  ],
  debts: [
    {
      id: '1',
      name: 'Boliglån',
      totalAmount: 4_200_000,
      remainingAmount: 3_650_000,
      interestRate: 5.15,
      monthlyPayment: 16_000,
      type: 'mortgage',
      includeInSnowball: false,
    },
    {
      id: '2',
      name: 'Studielån',
      totalAmount: 95_000,
      remainingAmount: 22_000,
      interestRate: 4.25,
      monthlyPayment: 2_200,
      type: 'student_loan',
      includeInSnowball: true,
    },
    {
      id: '3',
      name: 'Kredittkort',
      totalAmount: 85_000,
      remainingAmount: 38_000,
      interestRate: 19.9,
      monthlyPayment: 1_800,
      type: 'credit_card',
      includeInSnowball: true,
    },
  ],
  investments: [
    {
      id: '1',
      name: 'Globale indeksfond',
      type: 'funds',
      purchaseValue: 280_000,
      currentValue: 302_500,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 291_000 },
        { date: '2026-03-02', value: 296_000 },
        { date: '2026-03-09', value: 302_500 },
      ],
    },
    {
      id: '2',
      name: 'Teknologi ETF',
      type: 'stocks',
      purchaseValue: 145_000,
      currentValue: 168_000,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 155_000 },
        { date: '2026-03-02', value: 160_000 },
        { date: '2026-03-09', value: 168_000 },
      ],
    },
    {
      id: '3',
      name: 'Krypto',
      type: 'crypto',
      purchaseValue: 35_000,
      currentValue: 41_000,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 38_000 },
        { date: '2026-03-02', value: 37_500 },
        { date: '2026-03-09', value: 41_000 },
      ],
    },
  ],
}

/** Variant 3 — deltid / annen bonusmåned (november). */
const VARIANT_3: DemoVariantBody = {
  income: { salaryMonthly: 36_000, bonusMonthIndex: 10, bonusIncome: 52_000 },
  monthlyExpenses: [
    7_200, 890, 450, 310, 200, 280, 349, 6_800, 2_100, 850, 520, 320, 750, 780, 7_800, 1_800, 650, 950, 600, 2_000, 500,
  ],
  savingsGoals: [
    {
      id: '1',
      name: 'Feriefond',
      targetAmount: 22_000,
      currentAmount: 8_800,
      targetDate: '2026-07-01',
      color: '#3B5BDB',
      linkedBudgetCategoryId: 'demo-spar-1',
    },
    {
      id: '2',
      name: 'Nødfond',
      targetAmount: 75_000,
      currentAmount: 31_000,
      targetDate: '2026-12-01',
      color: '#0CA678',
      linkedBudgetCategoryId: 'demo-spar-4',
    },
    {
      id: '3',
      name: 'Bil',
      targetAmount: 180_000,
      currentAmount: 45_000,
      targetDate: '2027-03-01',
      color: '#F08C00',
      linkedBudgetCategoryId: 'demo-spar-2',
    },
  ],
  debts: [
    {
      id: '1',
      name: 'Boliglån',
      totalAmount: 2_100_000,
      remainingAmount: 1_820_000,
      interestRate: 5.35,
      monthlyPayment: 7_800,
      type: 'mortgage',
      includeInSnowball: false,
    },
    {
      id: '2',
      name: 'Studielån',
      totalAmount: 165_000,
      remainingAmount: 88_000,
      interestRate: 4.5,
      monthlyPayment: 1_800,
      type: 'student_loan',
      includeInSnowball: true,
    },
    {
      id: '3',
      name: 'Kredittkort',
      totalAmount: 28_000,
      remainingAmount: 9_200,
      interestRate: 21.9,
      monthlyPayment: 650,
      type: 'credit_card',
      includeInSnowball: true,
    },
  ],
  investments: [
    {
      id: '1',
      name: 'Bærekraft fond',
      type: 'funds',
      purchaseValue: 42_000,
      currentValue: 44_100,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 43_000 },
        { date: '2026-03-02', value: 43_600 },
        { date: '2026-03-09', value: 44_100 },
      ],
    },
    {
      id: '2',
      name: 'Bankaksjer',
      type: 'stocks',
      purchaseValue: 22_000,
      currentValue: 23_400,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 22_800 },
        { date: '2026-03-02', value: 23_100 },
        { date: '2026-03-09', value: 23_400 },
      ],
    },
  ],
}

/** Variant 4 — mellomhøy inntekt, annen sammensetning. */
const VARIANT_4: DemoVariantBody = {
  income: { salaryMonthly: 44_000, bonusMonthIndex: 5, bonusIncome: 68_000 },
  monthlyExpenses: [
    7_800, 1_150, 550, 380, 220, 320, 449, 7_900, 2_900, 1_350, 620, 350, 920, 900, 9_800, 1_900, 800, 1_800, 1_200, 1_100, 380,
  ],
  savingsGoals: [
    {
      id: '1',
      name: 'Feriefond',
      targetAmount: 35_000,
      currentAmount: 14_500,
      targetDate: '2026-07-01',
      color: '#3B5BDB',
      linkedBudgetCategoryId: 'demo-spar-1',
    },
    {
      id: '2',
      name: 'Nødfond',
      targetAmount: 120_000,
      currentAmount: 62_000,
      targetDate: '2026-12-01',
      color: '#0CA678',
      linkedBudgetCategoryId: 'demo-spar-4',
    },
    {
      id: '3',
      name: 'Oppussing',
      targetAmount: 95_000,
      currentAmount: 22_000,
      targetDate: '2026-10-01',
      color: '#F08C00',
      linkedBudgetCategoryId: 'demo-spar-2',
    },
  ],
  debts: [
    {
      id: '1',
      name: 'Boliglån',
      totalAmount: 3_050_000,
      remainingAmount: 2_720_000,
      interestRate: 5.25,
      monthlyPayment: 9_800,
      type: 'mortgage',
      includeInSnowball: false,
    },
    {
      id: '2',
      name: 'Studielån',
      totalAmount: 195_000,
      remainingAmount: 102_000,
      interestRate: 4.5,
      monthlyPayment: 1_900,
      type: 'student_loan',
      includeInSnowball: true,
    },
    {
      id: '3',
      name: 'Kredittkort',
      totalAmount: 42_000,
      remainingAmount: 14_500,
      interestRate: 21.9,
      monthlyPayment: 800,
      type: 'credit_card',
      includeInSnowball: true,
    },
  ],
  investments: [
    {
      id: '1',
      name: 'Nordiske indeks',
      type: 'funds',
      purchaseValue: 95_000,
      currentValue: 99_800,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 97_200 },
        { date: '2026-03-02', value: 98_400 },
        { date: '2026-03-09', value: 99_800 },
      ],
    },
    {
      id: '2',
      name: 'Eiendom fond',
      type: 'funds',
      purchaseValue: 48_000,
      currentValue: 49_600,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 48_900 },
        { date: '2026-03-02', value: 49_200 },
        { date: '2026-03-09', value: 49_600 },
      ],
    },
    {
      id: '3',
      name: 'Råvarer',
      type: 'stocks',
      purchaseValue: 15_000,
      currentValue: 15_750,
      purchaseDate: '2026-02-16',
      history: [
        { date: '2026-02-23', value: 15_400 },
        { date: '2026-03-02', value: 15_500 },
        { date: '2026-03-09', value: 15_750 },
      ],
    },
  ],
}

const VARIANT_BY_INDEX: Record<1 | 2 | 3 | 4, DemoVariantBody> = {
  1: VARIANT_1,
  2: VARIANT_2,
  3: VARIANT_3,
  4: VARIANT_4,
}

/**
 * Demo-inntektsmønster for smartSpare/seeding — samme som budsjett-/transaksjon-demo (variant 0 = standard i store).
 */
export function getDemoIncomePatternForVariant(variantIndex: number): DemoIncomePattern {
  const v = Math.min(Math.max(0, Math.floor(variantIndex)), 4)
  if (v === 0) {
    return { salaryMonthly: 50_000, bonusMonthIndex: 5, bonusIncome: 80_000 }
  }
  return VARIANT_BY_INDEX[v as 1 | 2 | 3 | 4].income
}

/** Månedlige beløp for demo-tjenesteabonnement (matcher `monthlyExpenses` indeks 3, 5, 6). */
export function getDemoSubscriptionMonthlyAmountsForVariant(variantIndex: number): DemoSubscriptionAmounts {
  const v = Math.min(Math.max(0, Math.floor(variantIndex)), 4)
  if (v === 0) {
    return { mobil: 400, streaming: 350, trening: 400 }
  }
  const body = VARIANT_BY_INDEX[v as 1 | 2 | 3 | 4]
  const m = body.monthlyExpenses
  return {
    mobil: m[3] ?? 0,
    streaming: m[5] ?? 0,
    trening: m[6] ?? 0,
  }
}

/** Grunnlag (uten transaksjoner) for demovariant 1–4 — ikke bruk for variant 0. */
export function createDemoBasePersonDataForNonZeroVariant(variantIndex: 1 | 2 | 3 | 4): PersonData {
  const body = VARIANT_BY_INDEX[variantIndex]
  return {
    transactions: [],
    budgetCategories: buildBudgetCategoriesFromVariant(body),
    ...emptyLabelLists(),
    savingsGoals: body.savingsGoals.map((g) => ({ ...g })),
    debts: body.debts.map((d) => ({ ...d })),
    investments: body.investments.map((i) => ({ ...i, history: i.history?.map((h) => ({ ...h })) })),
    serviceSubscriptions: [],
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
  }
}

export function buildDemoTransactionsForNonZeroVariant(
  year: number,
  profileId: string,
  variantIndex: 1 | 2 | 3 | 4,
): Transaction[] {
  const body = VARIANT_BY_INDEX[variantIndex]
  return buildDemoTransactionsForVariantBody(year, profileId, body)
}
