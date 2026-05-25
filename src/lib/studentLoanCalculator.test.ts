import { describe, expect, it } from 'vitest'
import {
  aggregateAmortizationByYear,
  budgetImpactPct,
  buildStudentLoanSchedule,
  capitalizeGracePeriodInterest,
  compareRepaymentTerms,
  estimatePrincipalFromStudy,
  estimateYearsFromPayment,
} from './studentLoanCalculator'
import { buildAmortizationSchedule } from './mortgageCalculator'

describe('studentLoanCalculator', () => {
  it('capitalizeGracePeriodInterest øker hovedstol ved grace', () => {
    const noGrace = capitalizeGracePeriodInterest(400_000, 5.5, 0)
    expect(noGrace.principalAtRepaymentStart).toBe(400_000)
    expect(noGrace.graceInterestCapitalized).toBe(0)

    const withGrace = capitalizeGracePeriodInterest(400_000, 5.5, 7)
    expect(withGrace.principalAtRepaymentStart).toBeGreaterThan(400_000)
    expect(withGrace.graceInterestCapitalized).toBeGreaterThan(0)
  })

  it('aggregateAmortizationByYear summerer måneder per år', () => {
    const rows = buildAmortizationSchedule(120_000, 5, 2)
    const years = aggregateAmortizationByYear(rows)
    expect(years).toHaveLength(2)
    expect(years[0]!.yearIndex).toBe(1)
    expect(years[1]!.balanceAfter).toBe(0)
  })

  it('compareRepaymentTerms viser lavere rente ved kortere løpetid', () => {
    const rows = compareRepaymentTerms(400_000, 5.5, 20)
    const y5 = rows.find((r) => r.years === 5)!
    const y20 = rows.find((r) => r.years === 20)!
    expect(y5.totalInterest).toBeLessThan(y20.totalInterest)
    expect(y5.interestSavedVsSelected).toBeGreaterThan(0)
    expect(y20.interestSavedVsSelected).toBe(0)
  })

  it('estimatePrincipalFromStudy med stipend', () => {
    expect(
      estimatePrincipalFromStudy({
        studyYears: 3,
        annualLoanAmount: 131_739,
        grantConversionPct: 30,
      }),
    ).toBe(Math.round(3 * 131_739 * 0.7))
  })

  it('estimateYearsFromPayment finner løpetid', () => {
    const result = buildStudentLoanSchedule({
      principal: 400_000,
      nominalAnnualRatePct: 5.5,
      years: 20,
      graceMonths: 0,
    })
    const years = estimateYearsFromPayment(400_000, 5.5, result.monthlyPayment)
    expect(years).toBe(20)
  })

  it('buildStudentLoanSchedule med grace gir høyere månedlig betaling', () => {
    const withoutGrace = buildStudentLoanSchedule({
      principal: 400_000,
      nominalAnnualRatePct: 5.5,
      years: 20,
      graceMonths: 0,
    })
    const withGrace = buildStudentLoanSchedule({
      principal: 400_000,
      nominalAnnualRatePct: 5.5,
      years: 20,
      graceMonths: 7,
    })
    expect(withGrace.monthlyPayment).toBeGreaterThan(withoutGrace.monthlyPayment)
    expect(withGrace.yearlySchedule.length).toBe(20)
  })

  it('null rente: grace og avdrag', () => {
    const result = buildStudentLoanSchedule({
      principal: 240_000,
      nominalAnnualRatePct: 0,
      years: 10,
      graceMonths: 0,
    })
    expect(result.monthlyPayment).toBe(2_000)
    expect(result.totalInterest).toBe(0)
  })

  it('budgetImpactPct', () => {
    const impact = budgetImpactPct(2_750, { monthlyExpenses: 25_000, monthlyNetIncome: 30_000 })
    expect(impact.expensePct).toBeCloseTo(11, 0)
    expect(impact.incomePct).toBeCloseTo(9.17, 1)
  })
})
