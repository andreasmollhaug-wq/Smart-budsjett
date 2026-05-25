import {
  annuityMonthlyPayment,
  buildAmortizationSchedule,
  effectiveAnnualRateFromNominalMonthly,
  firstYearInterestShareOfPayments,
  sumScheduleInterest,
  sumSchedulePayments,
  type AmortizationRow,
} from '@/lib/mortgageCalculator'
import type { BudgetCategory } from '@/lib/store'
import { effectiveBudgetedIncomeMonth } from '@/lib/incomeWithholding'
import {
  DEFAULT_GRACE_MONTHS_BEFORE_PAYMENT,
  STUDENT_LOAN_TERM_COMPARISON_YEARS,
} from './studentLoanCalculator.constants'

export type YearlyAmortizationRow = {
  yearIndex: number
  avgMonthlyPayment: number
  interestPaid: number
  principalPaid: number
  balanceAfter: number
}

export type TermComparisonRow = {
  years: number
  monthlyPayment: number
  totalPaid: number
  totalInterest: number
  interestSavedVsSelected: number
}

export type StudentLoanScheduleInput = {
  principal: number
  nominalAnnualRatePct: number
  years: number
  graceMonths?: number
}

export type StudentLoanScheduleResult = {
  principalAtRepaymentStart: number
  graceInterestCapitalized: number
  monthlyPayment: number
  effectiveAnnualRatePct: number
  totalPaid: number
  totalInterest: number
  firstYearInterestSharePct: number
  schedule: AmortizationRow[]
  yearlySchedule: YearlyAmortizationRow[]
}

export type StudyPrincipalEstimateInput = {
  studyYears: number
  annualLoanAmount: number
  grantConversionPct: number
}

export type BudgetImpactResult = {
  expensePct: number | null
  incomePct: number | null
}

/** Renter som løper uten betaling før første termin — kapitaliseres inn i hovedstol. */
export function capitalizeGracePeriodInterest(
  principal: number,
  nominalAnnualRatePct: number,
  graceMonths: number,
): { principalAtRepaymentStart: number; graceInterestCapitalized: number } {
  if (principal <= 0 || graceMonths <= 0 || nominalAnnualRatePct <= 0) {
    return { principalAtRepaymentStart: principal, graceInterestCapitalized: 0 }
  }

  const r = nominalAnnualRatePct / 100 / 12
  let balance = principal
  let graceInterest = 0

  for (let m = 0; m < graceMonths; m++) {
    const interest = Math.round(balance * r)
    graceInterest += interest
    balance += interest
  }

  return {
    principalAtRepaymentStart: balance,
    graceInterestCapitalized: graceInterest,
  }
}

export function aggregateAmortizationByYear(rows: AmortizationRow[]): YearlyAmortizationRow[] {
  if (rows.length === 0) return []

  const byYear = new Map<number, AmortizationRow[]>()
  for (const row of rows) {
    const yearIndex = Math.floor((row.monthIndex - 1) / 12)
    const list = byYear.get(yearIndex) ?? []
    list.push(row)
    byYear.set(yearIndex, list)
  }

  const years: YearlyAmortizationRow[] = []
  for (const [yearIndex, yearRows] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const interestPaid = yearRows.reduce((a, r) => a + r.interest, 0)
    const principalPaid = yearRows.reduce((a, r) => a + r.principal, 0)
    const paymentSum = yearRows.reduce((a, r) => a + r.payment, 0)
    const balanceAfter = yearRows[yearRows.length - 1]!.balanceAfter

    years.push({
      yearIndex: yearIndex + 1,
      avgMonthlyPayment: Math.round(paymentSum / yearRows.length),
      interestPaid,
      principalPaid,
      balanceAfter,
    })
  }

  return years
}

export function compareRepaymentTerms(
  principal: number,
  nominalAnnualRatePct: number,
  selectedYears: number,
  termsYears: readonly number[] = STUDENT_LOAN_TERM_COMPARISON_YEARS,
): TermComparisonRow[] {
  if (principal <= 0) return []

  const selectedSchedule = buildAmortizationSchedule(principal, nominalAnnualRatePct, selectedYears)
  const selectedInterest = sumScheduleInterest(selectedSchedule)

  return termsYears.map((years) => {
    const schedule = buildAmortizationSchedule(principal, nominalAnnualRatePct, years)
    const totalInterest = sumScheduleInterest(schedule)
    const totalPaid = sumSchedulePayments(schedule)
    const monthlyPayment = annuityMonthlyPayment(principal, nominalAnnualRatePct, years)

    return {
      years,
      monthlyPayment,
      totalPaid,
      totalInterest,
      interestSavedVsSelected: selectedInterest - totalInterest,
    }
  })
}

export function estimatePrincipalFromStudy(input: StudyPrincipalEstimateInput): number {
  const { studyYears, annualLoanAmount, grantConversionPct } = input
  if (studyYears <= 0 || annualLoanAmount <= 0) return 0

  const grantFactor = 1 - Math.min(100, Math.max(0, grantConversionPct)) / 100
  return Math.round(studyYears * annualLoanAmount * grantFactor)
}

/** Estimer nedbetalingstid (år) fra månedlig betaling — binærsøk innen 1–20 år. */
export function estimateYearsFromPayment(
  principal: number,
  nominalAnnualRatePct: number,
  monthlyPayment: number,
  maxYears = 20,
): number | null {
  if (principal <= 0 || monthlyPayment <= 0) return null

  let lo = 1
  let hi = maxYears
  let best: number | null = null

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const payment = annuityMonthlyPayment(principal, nominalAnnualRatePct, mid)
    if (payment <= monthlyPayment) {
      best = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  return best
}

export function computeMonthlyBudgetTotals(
  categories: BudgetCategory[] | undefined,
  monthIndex: number,
): { monthlyExpenses: number; monthlyNetIncome: number } {
  if (!categories?.length) {
    return { monthlyExpenses: 0, monthlyNetIncome: 0 }
  }

  let income = 0
  let expenses = 0

  for (const c of categories) {
    if (c.parentCategory === 'inntekter' && c.type === 'income') {
      income += effectiveBudgetedIncomeMonth(c, monthIndex)
    } else if (c.type === 'expense') {
      const arr = Array.isArray(c.budgeted) ? c.budgeted : Array(12).fill(c.budgeted || 0)
      expenses += arr[monthIndex] ?? 0
    }
  }

  return {
    monthlyExpenses: expenses,
    monthlyNetIncome: Math.max(0, income - expenses),
  }
}

export function budgetImpactPct(
  monthlyPayment: number,
  budgetTotals: { monthlyExpenses: number; monthlyNetIncome: number },
): BudgetImpactResult {
  if (monthlyPayment <= 0) {
    return { expensePct: null, incomePct: null }
  }

  const expensePct =
    budgetTotals.monthlyExpenses > 0
      ? (monthlyPayment / budgetTotals.monthlyExpenses) * 100
      : null

  const incomePct =
    budgetTotals.monthlyNetIncome > 0
      ? (monthlyPayment / budgetTotals.monthlyNetIncome) * 100
      : null

  return { expensePct, incomePct }
}

export function buildStudentLoanSchedule(input: StudentLoanScheduleInput): StudentLoanScheduleResult {
  const {
    principal,
    nominalAnnualRatePct,
    years,
    graceMonths = DEFAULT_GRACE_MONTHS_BEFORE_PAYMENT,
  } = input

  if (principal <= 0 || years <= 0) {
    return {
      principalAtRepaymentStart: 0,
      graceInterestCapitalized: 0,
      monthlyPayment: 0,
      effectiveAnnualRatePct: effectiveAnnualRateFromNominalMonthly(nominalAnnualRatePct),
      totalPaid: 0,
      totalInterest: 0,
      firstYearInterestSharePct: 0,
      schedule: [],
      yearlySchedule: [],
    }
  }

  const { principalAtRepaymentStart, graceInterestCapitalized } = capitalizeGracePeriodInterest(
    principal,
    nominalAnnualRatePct,
    graceMonths,
  )

  const monthlyPayment = annuityMonthlyPayment(
    principalAtRepaymentStart,
    nominalAnnualRatePct,
    years,
  )
  const schedule = buildAmortizationSchedule(
    principalAtRepaymentStart,
    nominalAnnualRatePct,
    years,
    monthlyPayment,
  )

  return {
    principalAtRepaymentStart,
    graceInterestCapitalized,
    monthlyPayment,
    effectiveAnnualRatePct: effectiveAnnualRateFromNominalMonthly(nominalAnnualRatePct),
    totalPaid: sumSchedulePayments(schedule),
    totalInterest: sumScheduleInterest(schedule),
    firstYearInterestSharePct: firstYearInterestShareOfPayments(schedule),
    schedule,
    yearlySchedule: aggregateAmortizationByYear(schedule),
  }
}
