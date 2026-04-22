import {
  effectiveBudgetedIncomeMonth,
  effectiveIncomeTransactionAmount,
  grossWithholdingNetForBudgetMonth,
  grossWithholdingNetForIncomeTransaction,
} from '@/lib/incomeWithholding'
import type { ParentCategory } from './budgetCategoryCatalog'
import type { BudgetCategory, Debt, Investment, PersonData, SavingsGoal, Transaction } from './store'

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
  people?: Record<string, PersonData>,
): CategoryMonthTotals {
  return sumTransactionsByCategoryForMonthRange(transactions, year, monthIndex, monthIndex, people)
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
  people?: Record<string, PersonData>,
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
      const pid = t.profileId ?? ''
      const def = people?.[pid]?.defaultIncomeWithholding
      cur.income += effectiveIncomeTransactionAmount(t, def)
    } else {
      cur.expense += t.amount
    }
    map.set(t.category, cur)
  }

  return map
}

/** Summer inntekt, utgift og netto per profil for samme månedintervall som `sumTransactionsByCategoryForMonthRange`. */
export interface IncomeExpenseNetByProfile {
  profileId: string
  income: number
  expense: number
  net: number
}

export function sumIncomeExpenseNetByProfileForMonthRange(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
  people?: Record<string, PersonData>,
): IncomeExpenseNetByProfile[] {
  const byProfile = new Map<string, { income: number; expense: number }>()

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

    const pid = t.profileId ?? ''
    const cur = byProfile.get(pid) ?? { income: 0, expense: 0 }
    if (t.type === 'income') {
      const def = people?.[pid]?.defaultIncomeWithholding
      cur.income += effectiveIncomeTransactionAmount(t, def)
    } else {
      cur.expense += t.amount
    }
    byProfile.set(pid, cur)
  }

  const rows: IncomeExpenseNetByProfile[] = []
  for (const [profileId, v] of byProfile) {
    rows.push({
      profileId,
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    })
  }
  rows.sort((a, b) => a.profileId.localeCompare(b.profileId))
  return rows
}

/** Faktisk beløp per profil for én kategori og type i samme månedintervall som `sumTransactionsByCategoryForMonthRange`. */
export interface ActualByProfileForCategory {
  profileId: string
  actual: number
}

export function sumActualByProfileForCategoryInMonthRange(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
  categoryName: string,
  type: 'income' | 'expense',
  people?: Record<string, PersonData>,
): ActualByProfileForCategory[] {
  const byProfile = new Map<string, number>()

  for (const t of transactions) {
    if (t.category !== categoryName || t.type !== type) continue
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

    const pid = t.profileId ?? ''
    const amt =
      type === 'income'
        ? effectiveIncomeTransactionAmount(t, people?.[pid]?.defaultIncomeWithholding)
        : Number.isFinite(t.amount)
          ? t.amount
          : 0
    byProfile.set(pid, (byProfile.get(pid) ?? 0) + amt)
  }

  const rows: ActualByProfileForCategory[] = []
  for (const [profileId, actual] of byProfile) {
    rows.push({ profileId, actual })
  }
  rows.sort((a, b) => a.profileId.localeCompare(b.profileId))
  return rows
}

/**
 * For hver budsjettkategori: faktisk beløp per kalendermåned (indeks 0–11) i ett år.
 * Transaksjon knyttes til linje kun når `type` matcher kategoriens type.
 */
export function buildCategoryActualsYearMatrix(
  transactions: Transaction[],
  year: number,
  categories: BudgetCategory[],
  people?: Record<string, PersonData>,
): Map<string, number[]> {
  const metaByName = new Map(categories.map((c) => [c.name, c]))
  const matrix = new Map<string, number[]>()
  for (const c of categories) {
    matrix.set(c.name, Array(12).fill(0))
  }
  for (const t of transactions) {
    if (!t.date || t.date.length < 7) continue
    const yy = Number(t.date.slice(0, 4))
    const mm = Number(t.date.slice(5, 7))
    if (!Number.isFinite(yy) || yy !== year || !Number.isFinite(mm) || mm < 1 || mm > 12) continue
    const meta = metaByName.get(t.category)
    if (!meta || meta.type !== t.type) continue
    const row = matrix.get(t.category)
    if (!row) continue
    const pid = t.profileId ?? ''
    const add =
      t.type === 'income'
        ? effectiveIncomeTransactionAmount(t, people?.[pid]?.defaultIncomeWithholding)
        : t.amount
    row[mm - 1] += add
  }
  return matrix
}

/**
 * Budsjettert beløp per kalendermåned (0–11) per kategori — speiler strukturen til buildCategoryActualsYearMatrix.
 */
export function buildCategoryBudgetYearMatrix(categories: BudgetCategory[]): Map<string, number[]> {
  const matrix = new Map<string, number[]>()
  for (const c of categories) {
    if (c.parentCategory === 'inntekter' && c.type === 'income') {
      matrix.set(
        c.name,
        Array.from({ length: 12 }, (_, i) => effectiveBudgetedIncomeMonth(c, i)),
      )
    } else {
      matrix.set(c.name, ensureBudgetedArray(c.budgeted))
    }
  }
  return matrix
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
    let budgeted = 0
    if (c.parentCategory === 'inntekter' && c.type === 'income') {
      for (let i = monthStartInclusive; i <= monthEndInclusive; i++) {
        budgeted += effectiveBudgetedIncomeMonth(c, i)
      }
    } else {
      budgeted = sumBudgetedForMonthRange(arr, monthStartInclusive, monthEndInclusive)
    }
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

export type ParentBudgetVsTotals = { budgeted: number; actual: number }

/** Agreggert budsjett og faktisk per hovedgruppe (for dashboard-oppsummering m.m.). */
export function sumBudgetVsActualByParent(
  rows: BudgetVsActualRow[],
): Record<ParentCategory, ParentBudgetVsTotals> {
  const out: Record<ParentCategory, ParentBudgetVsTotals> = {
    inntekter: { budgeted: 0, actual: 0 },
    regninger: { budgeted: 0, actual: 0 },
    utgifter: { budgeted: 0, actual: 0 },
    gjeld: { budgeted: 0, actual: 0 },
    sparing: { budgeted: 0, actual: 0 },
  }
  for (const r of rows) {
    const g = out[r.parentCategory]
    g.budgeted += r.budgeted
    g.actual += r.actual
  }
  return out
}

export function groupBudgetCategoriesByParent(
  categories: BudgetCategory[],
): Record<ParentCategory, BudgetCategory[]> {
  const out: Record<ParentCategory, BudgetCategory[]> = {
    inntekter: [],
    regninger: [],
    utgifter: [],
    gjeld: [],
    sparing: [],
  }
  for (const c of categories) {
    out[c.parentCategory].push(c)
  }
  for (const g of REPORT_GROUP_ORDER) {
    out[g].sort((a, b) => a.name.localeCompare(b.name, 'nb'))
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
  people?: Record<string, PersonData>,
): MonthlyBudgetActualPoint[] {
  const out: MonthlyBudgetActualPoint[] = []
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const totals = sumTransactionsByCategoryForMonthRange(
      transactions,
      year,
      monthIndex,
      monthIndex,
      people,
    )
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

/** Ett punkt per måned: budsjettert og faktisk netto (inntekt − utgift) i valgt månedintervall. */
export interface MonthlyNetPoint {
  monthIndex: number
  label: string
  budgetNet: number
  actualNet: number
}

/**
 * Netto per kalendermåned innenfor [monthStartInclusive, monthEndInclusive] (0–11),
 * samme definisjon som `buildMonthlyBudgetActualSeries` per måned.
 */
export function buildMonthlyNetSeriesForPeriod(
  transactions: Transaction[],
  year: number,
  budgetCategories: BudgetCategory[],
  monthStartInclusive: number,
  monthEndInclusive: number,
  people?: Record<string, PersonData>,
): MonthlyNetPoint[] {
  const a = Math.min(11, Math.max(0, Math.floor(monthStartInclusive)))
  const b = Math.min(11, Math.max(0, Math.floor(monthEndInclusive)))
  if (a > b) return []
  const start = a
  const end = b
  const out: MonthlyNetPoint[] = []
  for (let monthIndex = start; monthIndex <= end; monthIndex++) {
    const totals = sumTransactionsByCategoryForMonthRange(
      transactions,
      year,
      monthIndex,
      monthIndex,
      people,
    )
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
      budgetNet: budgetedIncome - budgetedExpense,
      actualNet: actualIncome - actualExpense,
    })
  }
  return out
}

/** Faktisk sum per måned (0–11) for inntekt eller utgift i ett budsjettår. */
export function sumActualsByMonthForType(
  transactions: Transaction[],
  year: number,
  type: 'income' | 'expense',
  people?: Record<string, PersonData>,
): number[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const totals = sumTransactionsByCategoryForMonthRange(
      transactions,
      year,
      monthIndex,
      monthIndex,
      people,
    )
    let s = 0
    for (const v of totals.values()) {
      s += type === 'income' ? v.income : v.expense
    }
    return s
  })
}

/** Siste inntil 6 måneder i budsjettåret (slutter på referansemåned): faktisk inntekt, utgift og netto per måned. Brukes på dashboard-graf. */
export function buildDashboardSixMonthIncomeExpense(
  transactions: Transaction[],
  budgetYear: number,
  people?: Record<string, PersonData>,
): { month: string; inntekt: number; utgift: number; netto: number }[] {
  const refMonth = referenceMonthIndexForBudgetYear(budgetYear)
  const startMonth = Math.max(0, refMonth - 5)
  const income = sumActualsByMonthForType(transactions, budgetYear, 'income', people)
  const expense = sumActualsByMonthForType(transactions, budgetYear, 'expense', people)
  const out: { month: string; inntekt: number; utgift: number; netto: number }[] = []
  for (let m = startMonth; m <= refMonth; m++) {
    const inn = income[m] ?? 0
    const ut = expense[m] ?? 0
    out.push({
      month: MONTH_LABELS_SHORT_NB[m] ?? String(m + 1),
      inntekt: inn,
      utgift: ut,
      netto: inn - ut,
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
      if (type === 'income' && c.parentCategory === 'inntekter') {
        s += effectiveBudgetedIncomeMonth(c, m)
      } else {
        const arr = ensureBudgetedArray(c.budgeted)
        s += arr[m] ?? 0
      }
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

export type BudgetedFixedMonthlyExpenseRow = { id: string; name: string; amount: number }

/** Månedlige utgiftskategorier med budsjett > 0 for én måned, sortert synkende på beløp. */
export function listBudgetedFixedMonthlyExpensesForMonth(
  budgetCategories: BudgetCategory[],
  monthIndex: number,
): BudgetedFixedMonthlyExpenseRow[] {
  const rows: BudgetedFixedMonthlyExpenseRow[] = []
  for (const c of budgetCategories) {
    if (c.type !== 'expense' || c.frequency !== 'monthly') continue
    const arr = ensureBudgetedArray(c.budgeted)
    const amount = arr[monthIndex] ?? 0
    if (amount <= 0) continue
    rows.push({ id: c.id, name: c.name, amount })
  }
  rows.sort((a, b) => b.amount - a.amount)
  return rows
}

/** Sum budsjettert inntekt én måned (alle inntektskategorier). */
export function sumBudgetedIncomeForMonth(budgetCategories: BudgetCategory[], monthIndex: number): number {
  let s = 0
  for (const c of budgetCategories) {
    if (c.type !== 'income') continue
    if (c.parentCategory === 'inntekter') {
      s += effectiveBudgetedIncomeMonth(c, monthIndex)
    } else {
      const arr = ensureBudgetedArray(c.budgeted)
      s += arr[monthIndex] ?? 0
    }
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

/** Summer inntekt og utgift for tre hele måneder bakover fra valgt måned (inkludert valgt måned). */
export function sumIncomeExpenseNetThreeMonthWindow(
  transactions: Transaction[],
  endYear: number,
  endMonthIndex: number,
  people?: Record<string, PersonData>,
): { income: number; expense: number; net: number } {
  let y = endYear
  let mi = endMonthIndex
  let income = 0
  let expense = 0
  for (let i = 0; i < 3; i++) {
    const totals = sumTransactionsByCategoryForMonth(transactions, y, mi, people)
    const ie = sumMonthlyIncomeExpense(totals)
    income += ie.income
    expense += ie.expense
    mi -= 1
    if (mi < 0) {
      mi = 11
      y -= 1
    }
  }
  return { income, expense, net: income - expense }
}

/** Brutto / forenklet trekk / netto for inntekt i én måned (samme definisjon som månedsinnsikt). */
export type BankReportIncomeDetail = {
  budgeted: { gross: number; withholding: number; net: number }
  actual: { gross: number; withholding: number; net: number }
}

/**
 * Når budsjett eller faktisk har positivt forenklet trekk i måneden, returnerer oppdelingen; ellers null.
 */
export function buildBankReportIncomeDetail(
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  year: number,
  monthIndex: number,
  people?: Record<string, PersonData>,
): BankReportIncomeDetail | null {
  const monthTotals = sumTransactionsByCategoryForMonth(transactions, year, monthIndex, people)
  const rows = buildBudgetVsActual(budgetCategories, monthTotals, monthIndex)
  let budgetedIncome = 0
  let actualIncome = 0
  for (const r of rows) {
    if (r.type !== 'income') continue
    budgetedIncome += r.budgeted
    actualIncome += r.actual
  }

  let budgetedGross = 0
  let budgetedWithholding = 0
  for (const c of budgetCategories) {
    if (c.parentCategory !== 'inntekter' || c.type !== 'income') continue
    const x = grossWithholdingNetForBudgetMonth(c, monthIndex)
    budgetedGross += x.gross
    budgetedWithholding += x.withholding
  }

  const monthPrefix = getMonthKey(year, monthIndex)
  let actualGross = 0
  let actualWithholding = 0
  for (const t of transactions) {
    if (t.type !== 'income' || !t.date?.startsWith(monthPrefix)) continue
    const pid = t.profileId ?? ''
    const def = people?.[pid]?.defaultIncomeWithholding
    const x = grossWithholdingNetForIncomeTransaction(t, def)
    actualGross += x.gross
    actualWithholding += x.withholding
  }

  if (budgetedWithholding <= 0 && actualWithholding <= 0) return null

  const { income: actualIncomeFromTotals } = sumMonthlyIncomeExpense(monthTotals)

  return {
    budgeted: {
      gross: budgetedGross,
      withholding: budgetedWithholding,
      net: budgetedIncome,
    },
    actual: {
      gross: actualGross,
      withholding: actualWithholding,
      net: actualIncomeFromTotals,
    },
  }
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
  consumer_loan: 'Forbrukslån',
  refinancing: 'Refinansiering',
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
