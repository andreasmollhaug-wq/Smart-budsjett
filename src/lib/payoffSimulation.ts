import type { Debt, DebtPayoffStrategy } from '@/lib/store'
import { isDebtInSnowball, sortPayoffQueue } from '@/lib/snowball'

const EPS = 0.5
const DEFAULT_MAX_MONTHS = 600

export type LoanPayoffMilestone = {
  debtId: string
  name: string
  monthIndex: number
  label: string
}

export type PayoffSimMonthPoint = {
  monthIndex: number
  /** Kort norsk måned + år, til akse */
  label: string
  /** Total månedlig betaling mot fokuslånet (min + ekstra + rullet) */
  snowballBar: number
  /** Sum månedlig rente på alle aktive lån i køen */
  interestLine: number
  /** Sum restgjeld i køen etter månedens betalinger */
  totalRemainingInQueue: number
}

export type PayoffSimResult = {
  monthly: PayoffSimMonthPoint[]
  /** Sum av alle månedlige renter over simuleringen */
  totalInterest: number
  /** Måneder til alt i køen er borte (null hvis ikke innen maxMonths) */
  monthsToDebtFree: number | null
  /** Siste måneds indeks (0-basert) når ferdig */
  debtFreeMonthIndex: number | null
  /** Ufullstendig: gjeld igjen etter max måneder */
  incomplete: boolean
  /** Rekkefølge lån blir estimert nedbetalt (én hendelse per utlignet lån) */
  loanPayoffs: LoanPayoffMilestone[]
}

type SimLoan = {
  id: string
  balance: number
  monthlyPayment: number
  annualRate: number
  template: Debt
}

function cloneQueueLoans(debts: Debt[]): SimLoan[] {
  return debts
    .filter(isDebtInSnowball)
    .map((d) => ({
      id: d.id,
      balance: Math.max(0, d.remainingAmount),
      monthlyPayment: d.monthlyPayment,
      annualRate: d.interestRate,
      template: d,
    }))
}

function monthLabel(monthIndex: number): string {
  const d = new Date(2026, monthIndex, 1)
  return d.toLocaleDateString('nb-NO', { month: 'short', year: '2-digit' })
}

/**
 * Månedlig simulering: rente på rest, minimum på alle, ekstra + rullet minimum mot fokus.
 * Baseline (for sammenligning): kjør med extraMonthly = 0 — samme rulling når lån betales ut.
 */
export function simulatePayoffSchedule(
  debts: Debt[],
  strategy: DebtPayoffStrategy,
  extraMonthly: number,
  maxMonths: number = DEFAULT_MAX_MONTHS,
): PayoffSimResult {
  const loans = cloneQueueLoans(debts)
  if (loans.length === 0) {
    return {
      monthly: [],
      totalInterest: 0,
      monthsToDebtFree: null,
      debtFreeMonthIndex: null,
      incomplete: false,
      loanPayoffs: [],
    }
  }

  let rolledMinimums = 0
  let totalInterest = 0
  const monthly: PayoffSimMonthPoint[] = []
  const loanPayoffs: LoanPayoffMilestone[] = []
  let monthsToDebtFree: number | null = null
  let debtFreeMonthIndex: number | null = null
  let incomplete = false

  for (let m = 0; m < maxMonths; m++) {
    const active = loans.filter((l) => l.balance > EPS)
    if (active.length === 0) {
      monthsToDebtFree = m
      debtFreeMonthIndex = m > 0 ? m - 1 : 0
      break
    }

    const debtsForSort = active.map((l) => ({ ...l.template, remainingAmount: l.balance }))
    const ordered = sortPayoffQueue(debtsForSort, strategy)
    const focusId = ordered[0]!.id

    let interestMonth = 0
    let payToFocus = 0
    let rolledDelta = 0

    for (const loan of active) {
      const I = loan.balance * (loan.annualRate / 100) / 12
      interestMonth += I
      let P = loan.monthlyPayment
      if (loan.id === focusId) {
        P += extraMonthly + rolledMinimums
        payToFocus = P
      }
      const newBal = Math.max(0, loan.balance + I - P)
      if (loan.balance > EPS && newBal < EPS) {
        rolledDelta += loan.monthlyPayment
        loanPayoffs.push({
          debtId: loan.id,
          name: loan.template.name,
          monthIndex: m,
          label: monthLabel(m),
        })
      }
      loan.balance = newBal
    }

    rolledMinimums += rolledDelta
    totalInterest += interestMonth

    const totalRemainingInQueue = loans.reduce((sum, l) => sum + l.balance, 0)

    monthly.push({
      monthIndex: m,
      label: monthLabel(m),
      snowballBar: payToFocus,
      interestLine: interestMonth,
      totalRemainingInQueue,
    })

    if (!loans.some((l) => l.balance > EPS)) {
      monthsToDebtFree = m + 1
      debtFreeMonthIndex = m
      break
    }
  }

  if (monthsToDebtFree === null && loans.some((l) => l.balance > EPS)) {
    incomplete = true
  }

  return {
    monthly,
    totalInterest,
    monthsToDebtFree,
    debtFreeMonthIndex,
    incomplete,
    loanPayoffs,
  }
}

export function comparePayoffVsBaseline(
  debts: Debt[],
  strategy: DebtPayoffStrategy,
  extraMonthly: number,
  maxMonths: number = DEFAULT_MAX_MONTHS,
): {
  strategy: PayoffSimResult
  baseline: PayoffSimResult
  savedInterest: number
  monthsSaved: number | null
} {
  const strategySim = simulatePayoffSchedule(debts, strategy, extraMonthly, maxMonths)
  const baselineSim = simulatePayoffSchedule(debts, strategy, 0, maxMonths)

  const savedInterest = baselineSim.totalInterest - strategySim.totalInterest

  let monthsSaved: number | null = null
  if (
    strategySim.monthsToDebtFree !== null &&
    baselineSim.monthsToDebtFree !== null
  ) {
    monthsSaved = baselineSim.monthsToDebtFree - strategySim.monthsToDebtFree
  }

  return {
    strategy: strategySim,
    baseline: baselineSim,
    savedInterest,
    monthsSaved,
  }
}

/** Tynn ut punkter til graf (hver n-te måned) hvis mange måneder */
export function sampleMonthlyForChart(points: PayoffSimMonthPoint[], maxPoints = 48): PayoffSimMonthPoint[] {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  const out: PayoffSimMonthPoint[] = []
  for (let i = 0; i < points.length; i += step) {
    out.push(points[i]!)
  }
  const last = points[points.length - 1]
  if (last && out[out.length - 1]?.monthIndex !== last.monthIndex) {
    out.push(last)
  }
  return out
}
