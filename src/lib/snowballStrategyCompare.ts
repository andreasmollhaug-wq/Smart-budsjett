import type { Debt, DebtPayoffStrategy } from '@/lib/store'
import { isDebtInSnowball } from '@/lib/snowball'
import {
  simulatePayoffSchedule,
  type PayoffSimResult,
} from '@/lib/payoffSimulation'

export type StrategyCompareChartPoint = {
  monthIndex: number
  label: string
  snowballRemaining: number
  avalancheRemaining: number
  snowballInterest: number
  avalancheInterest: number
  snowballCumulativeInterest: number
  avalancheCumulativeInterest: number
}

export type StrategyCompareTableRow = {
  monthIndex: number
  label: string
  snowballRemaining: number
  avalancheRemaining: number
  differenceRemaining: number
}

export type StrategyCompareSummary = {
  snowballTotalInterest: number
  avalancheTotalInterest: number
  interestDifference: number
  snowballDebtFreeMonthIndex: number | null
  avalancheDebtFreeMonthIndex: number | null
  snowballIncomplete: boolean
  avalancheIncomplete: boolean
  snowballMonthsToDebtFree: number | null
  avalancheMonthsToDebtFree: number | null
  monthsSavedByAvalanche: number | null
  sameOrderEstimate: boolean
}

export type StrategyCompareBundle = {
  snowball: PayoffSimResult
  avalanche: PayoffSimResult
  summary: StrategyCompareSummary
  chartPoints: StrategyCompareChartPoint[]
  tableRows: StrategyCompareTableRow[]
}

function debtFreeLabelFromMonthIndex(monthIndex: number | null, incomplete: boolean): string {
  if (incomplete || monthIndex === null) return '—'
  const d = new Date(2026, monthIndex + 1, 1)
  return d.toLocaleDateString('nb-NO', { month: 'short', year: 'numeric' })
}

export function formatDebtFreeLabel(
  monthIndex: number | null,
  incomplete: boolean,
): string {
  return debtFreeLabelFromMonthIndex(monthIndex, incomplete)
}

function pickRemaining(sim: PayoffSimResult, monthIndex: number): number {
  const point = sim.monthly.find((p) => p.monthIndex === monthIndex)
  if (point) return point.totalRemainingInQueue
  const last = sim.monthly[sim.monthly.length - 1]
  if (last && monthIndex > last.monthIndex) return 0
  return 0
}

function pickInterest(sim: PayoffSimResult, monthIndex: number): number {
  return sim.monthly.find((p) => p.monthIndex === monthIndex)?.interestLine ?? 0
}

function sampleComparePoints(points: StrategyCompareChartPoint[], maxPoints: number): StrategyCompareChartPoint[] {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  const out: StrategyCompareChartPoint[] = []
  for (let i = 0; i < points.length; i += step) out.push(points[i]!)
  const last = points[points.length - 1]
  if (last && out[out.length - 1]?.monthIndex !== last.monthIndex) out.push(last)
  return out
}

export function buildStrategyCompareChartPoints(
  snowball: PayoffSimResult,
  avalanche: PayoffSimResult,
  maxPoints = 48,
): StrategyCompareChartPoint[] {
  const maxMonth = Math.max(
    snowball.monthly[snowball.monthly.length - 1]?.monthIndex ?? 0,
    avalanche.monthly[avalanche.monthly.length - 1]?.monthIndex ?? 0,
  )
  const all: StrategyCompareChartPoint[] = []
  let snowCum = 0
  let avCum = 0

  for (let m = 0; m <= maxMonth; m++) {
    const snowInt = pickInterest(snowball, m)
    const avInt = pickInterest(avalanche, m)
    snowCum += snowInt
    avCum += avInt
    const label =
      snowball.monthly.find((p) => p.monthIndex === m)?.label ??
      avalanche.monthly.find((p) => p.monthIndex === m)?.label ??
      ''
    if (!label && snowInt === 0 && avInt === 0 && pickRemaining(snowball, m) === 0 && pickRemaining(avalanche, m) === 0) {
      continue
    }
    all.push({
      monthIndex: m,
      label,
      snowballRemaining: pickRemaining(snowball, m),
      avalancheRemaining: pickRemaining(avalanche, m),
      snowballInterest: snowInt,
      avalancheInterest: avInt,
      snowballCumulativeInterest: snowCum,
      avalancheCumulativeInterest: avCum,
    })
  }

  return sampleComparePoints(all, maxPoints)
}

export function buildStrategyCompareTableRows(
  snowball: PayoffSimResult,
  avalanche: PayoffSimResult,
  maxRows = 36,
): StrategyCompareTableRow[] {
  const maxMonth = Math.max(
    snowball.monthly[snowball.monthly.length - 1]?.monthIndex ?? 0,
    avalanche.monthly[avalanche.monthly.length - 1]?.monthIndex ?? 0,
  )
  const rows: StrategyCompareTableRow[] = []
  for (let m = 0; m <= maxMonth; m++) {
    const snowRem = pickRemaining(snowball, m)
    const avRem = pickRemaining(avalanche, m)
    const label =
      snowball.monthly.find((p) => p.monthIndex === m)?.label ??
      avalanche.monthly.find((p) => p.monthIndex === m)?.label ??
      ''
    if (!label && snowRem === 0 && avRem === 0) continue
    rows.push({
      monthIndex: m,
      label,
      snowballRemaining: snowRem,
      avalancheRemaining: avRem,
      differenceRemaining: avRem - snowRem,
    })
  }
  if (rows.length <= maxRows) return rows
  const step = Math.ceil(rows.length / maxRows)
  const out: StrategyCompareTableRow[] = []
  for (let i = 0; i < rows.length; i += step) out.push(rows[i]!)
  const last = rows[rows.length - 1]
  if (last && out[out.length - 1]?.monthIndex !== last.monthIndex) out.push(last)
  return out
}

export function buildStrategyCompareSummary(
  snowball: PayoffSimResult,
  avalanche: PayoffSimResult,
): StrategyCompareSummary {
  const interestDifference = snowball.totalInterest - avalanche.totalInterest
  let monthsSavedByAvalanche: number | null = null
  if (
    snowball.monthsToDebtFree !== null &&
    avalanche.monthsToDebtFree !== null
  ) {
    monthsSavedByAvalanche = snowball.monthsToDebtFree - avalanche.monthsToDebtFree
  }
  return {
    snowballTotalInterest: snowball.totalInterest,
    avalancheTotalInterest: avalanche.totalInterest,
    interestDifference,
    snowballDebtFreeMonthIndex: snowball.debtFreeMonthIndex,
    avalancheDebtFreeMonthIndex: avalanche.debtFreeMonthIndex,
    snowballIncomplete: snowball.incomplete,
    avalancheIncomplete: avalanche.incomplete,
    snowballMonthsToDebtFree: snowball.monthsToDebtFree,
    avalancheMonthsToDebtFree: avalanche.monthsToDebtFree,
    monthsSavedByAvalanche,
    sameOrderEstimate: Math.abs(interestDifference) < 1,
  }
}

export function hasSnowballQueue(debts: Debt[]): boolean {
  return debts.some((d) => isDebtInSnowball(d) && d.remainingAmount > 0)
}

export function buildStrategyCompareBundle(
  debts: Debt[],
  extraMonthly: number,
): StrategyCompareBundle | null {
  if (!hasSnowballQueue(debts)) return null
  return buildStrategyCompareBundleFromDebts(debts, extraMonthly)
}

function buildStrategyCompareBundleFromDebts(
  debts: Debt[],
  extraMonthly: number,
): StrategyCompareBundle {
  const snowball = simulatePayoffSchedule(debts, 'snowball', extraMonthly)
  const avalanche = simulatePayoffSchedule(debts, 'avalanche', extraMonthly)
  return {
    snowball,
    avalanche,
    summary: buildStrategyCompareSummary(snowball, avalanche),
    chartPoints: buildStrategyCompareChartPoints(snowball, avalanche),
    tableRows: buildStrategyCompareTableRows(snowball, avalanche),
  }
}

/** Fiktivt eksempelscenario for veiledning — ikke brukerens egne tall. */
export const snowballStrategyCompareDemo = {
  extraMonthly: 2_000,
  intro:
    'Tre lån der rekkefølgen blir forskjellig: Snøball starter med det minste lånet (5 000 kr), Avalanche med høyest rente (kredittkort 22 %). Med 2 000 kr/mnd ekstra ser du tydelig forskjell i total rente.',
  payoffOrder: {
    snowball: ['Smått forbrukslån', 'Kredittkort', 'Billån'],
    avalanche: ['Kredittkort', 'Smått forbrukslån', 'Billån'],
  },
  loans: [
    { name: 'Smått forbrukslån', remainingAmount: 5_000, interestRate: 8, monthlyPayment: 200 },
    { name: 'Kredittkort', remainingAmount: 25_000, interestRate: 22, monthlyPayment: 750 },
    { name: 'Billån', remainingAmount: 70_000, interestRate: 5.5, monthlyPayment: 1_400 },
  ],
} as const

const DEMO_DEBTS: Debt[] = snowballStrategyCompareDemo.loans.map((loan, i) => ({
  id: `demo-${i}`,
  name: loan.name,
  totalAmount: loan.remainingAmount,
  remainingAmount: loan.remainingAmount,
  interestRate: loan.interestRate,
  monthlyPayment: loan.monthlyPayment,
  type: i === 0 ? 'credit_card' : i === 1 ? 'consumer_loan' : 'loan',
  includeInSnowball: true,
}))

export function buildDemoStrategyCompareBundle(): StrategyCompareBundle {
  return buildStrategyCompareBundleFromDebts(DEMO_DEBTS, snowballStrategyCompareDemo.extraMonthly)
}

export function cheaperStrategyLabel(summary: StrategyCompareSummary): DebtPayoffStrategy | 'tie' {
  if (summary.sameOrderEstimate) return 'tie'
  return summary.interestDifference > 0 ? 'avalanche' : 'snowball'
}
