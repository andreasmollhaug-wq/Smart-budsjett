import type { FormuebyggerInput, FormuebyggerResult, MonthRow, YearRow } from './types'
import { isSavingsMonth } from './savingsSchedule'

/**
 * Månedlig sammensatt rente fra nominell årsrente (som i produktspesifikasjonen).
 * compoundFrequency lagres i input; kjerne-MVP bruker månedlig sammensetning (n=12).
 */
export function monthlyRateFromAnnual(annualReturn: number): number {
  return (1 + annualReturn) ** (1 / 12) - 1
}

/**
 * Simulerer måned for måned. Ekstra innskudd: `extraByGlobalMonth[m]` legges til før sparing og avkastning den måneden.
 */
export function simulateFormuebygger(
  input: FormuebyggerInput,
  extraByGlobalMonth: number[] | undefined,
): FormuebyggerResult {
  const {
    startAmount,
    annualReturn,
    savingsPerPayment,
    savingsFrequency,
    years,
    taxRate,
    inflation,
  } = input

  const totalMonths = Math.max(0, Math.min(60, years)) * 12
  const rM = monthlyRateFromAnnual(annualReturn)
  const extras = extraByGlobalMonth ?? []

  const months: MonthRow[] = []
  let ib = startAmount
  let cumulativePeriodic = 0
  let totalExtra = 0
  let totalGrossReturn = 0
  let totalTax = 0

  for (let m = 0; m < totalMonths; m++) {
    const yearIndex = Math.floor(m / 12)
    const monthInYear = m % 12
    const extra = Math.max(0, extras[m] ?? 0)
    totalExtra += extra

    const savings = isSavingsMonth(monthInYear, savingsFrequency) ? savingsPerPayment : 0
    cumulativePeriodic += savings

    const base = ib + extra + savings
    const grossReturn = base * rM
    const tax = base * rM * taxRate
    const ub = base * (1 + rM) - tax

    totalGrossReturn += grossReturn
    totalTax += tax

    const yearsElapsed = (m + 1) / 12
    const realValue = ub / (1 + inflation) ** yearsElapsed

    months.push({
      globalMonthIndex: m,
      monthInYear: monthInYear + 1,
      yearIndex,
      ib,
      savings,
      extra,
      grossReturn,
      tax,
      ub,
      cumulativePeriodicSavings: cumulativePeriodic,
      realValue,
    })

    ib = ub
  }

  const totalPeriodicSavings = cumulativePeriodic
  const totalDeposits = startAmount + totalPeriodicSavings + totalExtra
  const finalNominal = months.length > 0 ? months[months.length - 1]!.ub : startAmount
  const finalReal = months.length > 0 ? months[months.length - 1]!.realValue : startAmount
  const totalReturnAmount = finalNominal - totalDeposits
  const returnPctOfDeposits = totalDeposits > 0 ? totalReturnAmount / totalDeposits : 0

  const yearRows = aggregateYears(months, inflation)

  return {
    months,
    years: yearRows,
    totalPeriodicSavings,
    totalExtraDeposits: totalExtra,
    totalDeposits,
    totalGrossReturn,
    totalTaxPaid: totalTax,
    finalNominal,
    finalReal,
    returnPctOfDeposits,
  }
}

function aggregateYears(months: MonthRow[], inflation: number): YearRow[] {
  if (months.length === 0) return []

  const byYear = new Map<number, MonthRow[]>()
  for (const row of months) {
    const list = byYear.get(row.yearIndex) ?? []
    list.push(row)
    byYear.set(row.yearIndex, list)
  }

  const years: YearRow[] = []
  for (const [yearIndex, rows] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const ib = rows[0]!.ib
    const annualSavings = rows.reduce((s, r) => s + r.savings, 0)
    const annualExtra = rows.reduce((s, r) => s + r.extra, 0)
    const annualGrossReturn = rows.reduce((s, r) => s + r.grossReturn, 0)
    const annualTax = rows.reduce((s, r) => s + r.tax, 0)
    const ub = rows[rows.length - 1]!.ub
    const lastM = rows[rows.length - 1]!.globalMonthIndex
    const yearsElapsed = (lastM + 1) / 12
    const realValue = ub / (1 + inflation) ** yearsElapsed

    years.push({
      yearIndex,
      ib,
      annualSavings,
      annualExtra,
      annualGrossReturn,
      annualTax,
      ub,
      realValue,
    })
  }

  return years
}
