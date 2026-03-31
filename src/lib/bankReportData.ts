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
  const prefix = getMonthKey(year, monthIndex)
  const map: CategoryMonthTotals = new Map()

  for (const t of transactions) {
    if (!t.date.startsWith(prefix)) continue
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

export interface BudgetVsActualRow {
  categoryId: string
  name: string
  parentCategory: ParentCategory
  type: 'income' | 'expense'
  budgeted: number
  actual: number
  variance: number
}

export function buildBudgetVsActual(
  budgetCategories: BudgetCategory[],
  totals: CategoryMonthTotals,
  monthIndex: number,
): BudgetVsActualRow[] {
  const rows: BudgetVsActualRow[] = []

  for (const c of budgetCategories) {
    const arr = ensureBudgetedArray(c.budgeted)
    const budgeted = arr[monthIndex] ?? 0
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
