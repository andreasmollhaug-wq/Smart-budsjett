import type { ParentCategory } from './budgetCategoryCatalog'
import type { BudgetCategory, Debt, Investment, SavingsGoal, Transaction } from './store'

export const REPORT_GROUP_ORDER: ParentCategory[] = [
  'inntekter',
  'regninger',
  'utgifter',
  'gjeld',
  'sparing',
]

export const REPORT_GROUP_LABELS: Record<ParentCategory, string> = {
  inntekter: 'Inntekter',
  regninger: 'Regninger',
  utgifter: 'Utgifter',
  gjeld: 'Gjeld',
  sparing: 'Sparing',
}

/** Faktisk inntekt og utgift per kategorinavn i valgt måned */
export type CategoryMonthTotals = Map<string, { income: number; expense: number }>

export function getMonthKey(year: number, monthIndex: number): string {
  const m = monthIndex + 1
  return `${year}-${String(m).padStart(2, '0')}`
}

function ensureBudgetedArray(budgeted: number[] | undefined): number[] {
  if (Array.isArray(budgeted) && budgeted.length === 12) return budgeted
  return Array(12).fill(0)
}

/**
 * Summer transaksjoner per kategori for én kalendermåned (YYYY-MM prefiks på date).
 */
export function sumTransactionsByCategoryForMonth(
  transactions: Transaction[],
  year: number,
  monthIndex: number,
): CategoryMonthTotals {
  return sumTransactionsByCategoryForMonthRange(transactions, year, monthIndex, monthIndex)
}

/**
 * Summer transaksjoner per kategori for et sammenhengende månedintervall i ett kalenderår
 * (monthStartInclusive og monthEndInclusive er 0–11, jan–des).
 */
export function sumTransactionsByCategoryForMonthRange(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
): CategoryMonthTotals {
  const map: CategoryMonthTotals = new Map()

  for (const t of transactions) {
    if (!t.date || t.date.length < 7) continue
    const ym = t.date.slice(0, 7)
    const parts = ym.split('-')
    if (parts.length < 2) continue
    const yy = Number(parts[0])
    const mm = Number(parts[1])
    if (!Number.isFinite(yy) || !Number.isFinite(mm) || yy !== year) continue
    if (mm < 1 || mm > 12) continue
    const monthIndex = mm - 1
    if (monthIndex < monthStartInclusive || monthIndex > monthEndInclusive) continue

    const cur = map.get(t.category) ?? { income: 0, expense: 0 }
    if (t.type === 'income') {
      cur.income += t.amount
    } else {
      cur.expense += t.amount
    }
    map.set(t.category, cur)
  }

  return map
}

function sumBudgetedForMonthRange(arr: number[], monthStart: number, monthEnd: number): number {
  let s = 0
  for (let i = monthStart; i <= monthEnd; i++) {
    s += arr[i] ?? 0
  }
  return s
}

export interface BudgetVsActualRow {
  categoryId: string
  name: string
  parentCategory: ParentCategory
  type: 'income' | 'expense'
  budgeted: number
  actual: number
  variance: number
}

export function buildBudgetVsActualForPeriod(
  budgetCategories: BudgetCategory[],
  totals: CategoryMonthTotals,
  monthStartInclusive: number,
  monthEndInclusive: number,
): BudgetVsActualRow[] {
  const rows: BudgetVsActualRow[] = []

  for (const c of budgetCategories) {
    const arr = ensureBudgetedArray(c.budgeted)
    const budgeted = sumBudgetedForMonthRange(arr, monthStartInclusive, monthEndInclusive)
    const t = totals.get(c.name)
    const actual =
      c.type === 'income' ? (t?.income ?? 0) : (t?.expense ?? 0)
    const variance = actual - budgeted

    rows.push({
      categoryId: c.id,
      name: c.name,
      parentCategory: c.parentCategory,
      type: c.type,
      budgeted,
      actual,
      variance,
    })
  }

  return rows
}

/** Én kalendermåned — brukes bl.a. av bankrapport. */
export function buildBudgetVsActual(
  budgetCategories: BudgetCategory[],
  totals: CategoryMonthTotals,
  monthIndex: number,
): BudgetVsActualRow[] {
  return buildBudgetVsActualForPeriod(budgetCategories, totals, monthIndex, monthIndex)
}

export function groupBudgetVsActualByParent(
  rows: BudgetVsActualRow[],
): Record<ParentCategory, BudgetVsActualRow[]> {
  const out: Record<ParentCategory, BudgetVsActualRow[]> = {
    inntekter: [],
    regninger: [],
    utgifter: [],
    gjeld: [],
    sparing: [],
  }
  for (const r of rows) {
    out[r.parentCategory].push(r)
  }
  return out
}

/** Korte månedsnavn (jan–des), indeks 0–11. */
export const MONTH_LABELS_SHORT_NB = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

const MONTH_LABELS_SHORT = MONTH_LABELS_SHORT_NB

/** Ett punkt per kalendermåned for årstrend (budsjett vs faktisk inntekt/utgift). */
export interface MonthlyBudgetActualPoint {
  monthIndex: number
  label: string
  budgetedIncome: number
  budgetedExpense: number
  actualIncome: number
  actualExpense: number
}

/**
 * 12 måneder for ett år: per måned summeres budsjett og faktisk inntekt/utgift
 * likt som i budsjett-vs-faktisk-tabellene (én måned om gangen).
 */
export function buildMonthlyBudgetActualSeries(
  transactions: Transaction[],
  year: number,
  budgetCategories: BudgetCategory[],
): MonthlyBudgetActualPoint[] {
  const out: MonthlyBudgetActualPoint[] = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const totals = sumTransactionsByCategoryForMonthRange(transactions, year, monthIndex, monthIndex)
    const rows = buildBudgetVsActualForPeriod(budgetCategories, totals, monthIndex, monthIndex)
    let budgetedIncome = 0
    let budgetedExpense = 0
    let actualIncome = 0
    let actualExpense = 0
    for (const r of rows) {
      if (r.type === 'income') {
        budgetedIncome += r.budgeted
        actualIncome += r.actual
      } else {
        budgetedExpense += r.budgeted
        actualExpense += r.actual
      }
    }
    out.push({
      monthIndex,
      label: MONTH_LABELS_SHORT[monthIndex] ?? String(monthIndex + 1),
      budgetedIncome,
      budgetedExpense,
      actualIncome,
      actualExpense,
    })
  }
  return out
}

/** Faktisk sum per måned (0–11) for inntekt eller utgift i ett budsjettår. */
export function sumActualsByMonthForType(
  transactions: Transaction[],
  year: number,
  type: 'income' | 'expense',
): number[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const totals = sumTransactionsByCategoryForMonthRange(transactions, year, monthIndex, monthIndex)
    let s = 0
    for (const v of totals.values()) {
      s += type === 'income' ? v.income : v.expense
    }
    return s
  })
}

/** Siste inntil 6 måneder i budsjettåret (slutter på referansemåned): faktisk inntekt og utgift per måned. Brukes på dashboard-graf. */
export function buildDashboardSixMonthIncomeExpense(
  transactions: Transaction[],
  budgetYear: number,
): { month: string; inntekt: number; utgift: number }[] {
  const refMonth = referenceMonthIndexForBudgetYear(budgetYear)
  const startMonth = Math.max(0, refMonth - 5)
  const income = sumActualsByMonthForType(transactions, budgetYear, 'income')
  const expense = sumActualsByMonthForType(transactions, budgetYear, 'expense')
  const out: { month: string; inntekt: number; utgift: number }[] = []
  for (let m = startMonth; m <= refMonth; m++) {
    out.push({
      month: MONTH_LABELS_SHORT_NB[m] ?? String(m + 1),
      inntekt: income[m] ?? 0,
      utgift: expense[m] ?? 0,
    })
  }
  return out
}

/** Budsjettert sum per måned (0–11) aggregert over alle kategorier av gitt type. */
export function sumBudgetedByMonthForType(budgetCategories: BudgetCategory[], type: 'income' | 'expense'): number[] {
  return Array.from({ length: 12 }, (__, m) => {
    let s = 0
    for (const c of budgetCategories) {
      if (c.type !== type) continue
      const arr = ensureBudgetedArray(c.budgeted)
      s += arr[m] ?? 0
    }
    return s
  })
}

/** Månedsindeks 0–11 for visning: inneværende måned hvis år = kalenderår, ellers januar. */
export function referenceMonthIndexForBudgetYear(budgetYear: number): number {
  const now = new Date()
  return now.getFullYear() === budgetYear ? now.getMonth() : 0
}

/** Sum budsjettert for månedlige utgiftskategorier (frequency monthly) én måned. */
export function sumBudgetedFixedMonthlyExpensesForMonth(
  budgetCategories: BudgetCategory[],
  monthIndex: number,
): number {
  let s = 0
  for (const c of budgetCategories) {
    if (c.type !== 'expense' || c.frequency !== 'monthly') continue
    const arr = ensureBudgetedArray(c.budgeted)
    s += arr[monthIndex] ?? 0
  }
  return s
}

/** Sum budsjettert inntekt én måned (alle inntektskategorier). */
export function sumBudgetedIncomeForMonth(budgetCategories: BudgetCategory[], monthIndex: number): number {
  let s = 0
  for (const c of budgetCategories) {
    if (c.type !== 'income') continue
    const arr = ensureBudgetedArray(c.budgeted)
    s += arr[monthIndex] ?? 0
  }
  return s
}

export function sumMonthlyIncomeExpense(totals: CategoryMonthTotals): {
  income: number
  expense: number
} {
  let income = 0
  let expense = 0
  for (const v of totals.values()) {
    income += v.income
    expense += v.expense
  }
  return { income, expense }
}

export interface BankReportKpis {
  netCashflowMonth: number
  totalDebtRemaining: number
  totalMonthlyDebtPayments: number
  totalInvestmentsValue: number
  totalInvestmentsCost: number
  savingsGoalsCount: number
  savingsGoalsTotalTarget: number
  savingsGoalsTotalCurrent: number
}

export function buildBankReportKpis(
  debts: Debt[],
  investments: Investment[],
  savingsGoals: SavingsGoal[],
  monthTotals: CategoryMonthTotals,
): BankReportKpis {
  const { income, expense } = sumMonthlyIncomeExpense(monthTotals)

  let totalDebtRemaining = 0
  let totalMonthlyDebtPayments = 0
  for (const d of debts) {
    totalDebtRemaining += d.remainingAmount
    if (!d.repaymentPaused) {
      totalMonthlyDebtPayments += d.monthlyPayment
    }
  }

  let totalInvestmentsValue = 0
  let totalInvestmentsCost = 0
  for (const i of investments) {
    totalInvestmentsValue += i.currentValue
    totalInvestmentsCost += i.purchaseValue
  }

  let savingsGoalsTotalTarget = 0
  let savingsGoalsTotalCurrent = 0
  for (const g of savingsGoals) {
    savingsGoalsTotalTarget += g.targetAmount
    savingsGoalsTotalCurrent += g.currentAmount
  }

  return {
    netCashflowMonth: income - expense,
    totalDebtRemaining,
    totalMonthlyDebtPayments,
    totalInvestmentsValue,
    totalInvestmentsCost,
    savingsGoalsCount: savingsGoals.length,
    savingsGoalsTotalTarget,
    savingsGoalsTotalCurrent,
  }
}

const DEBT_TYPE_LABELS: Record<Debt['type'], string> = {
  loan: 'Lån',
  credit_card: 'Kredittkort',
  mortgage: 'Boliglån',
  student_loan: 'Studielån',
  other: 'Annet',
}

export function debtTypeLabel(type: Debt['type']): string {
  return DEBT_TYPE_LABELS[type] ?? type
}

const INVESTMENT_TYPE_LABELS: Record<Investment['type'], string> = {
  stocks: 'Aksjer',
  funds: 'Fond',
  crypto: 'Krypto',
  bonds: 'Obligasjoner',
  other: 'Annet',
}

export function investmentTypeLabel(type: Investment['type']): string {
  return INVESTMENT_TYPE_LABELS[type] ?? type
}
