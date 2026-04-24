import { describe, expect, it } from 'vitest'
import {
  annuityMonthlyPayment,
  buildAmortizationSchedule,
  effectiveAnnualRateFromNominalMonthly,
  equityRequired,
  firstYearInterestShareOfPayments,
  loanToValuePct,
  monthlyPaymentForNominalWithDelta,
  sumScheduleInterest,
  sumSchedulePayments,
  totalPaidOverTerm,
} from './mortgageCalculator'

describe('mortgageCalculator', () => {
  it('loanToValuePct og equityRequired', () => {
    expect(loanToValuePct(4_500_000, 6_000_000)).toBeCloseTo(75, 5)
    expect(equityRequired(6_000_000, 4_500_000)).toBe(1_500_000)
  })

  it('null rente: flat avdrag', () => {
    expect(annuityMonthlyPayment(1_200_000, 0, 10)).toBe(10_000)
    const rows = buildAmortizationSchedule(1_200_000, 0, 10)
    expect(rows).toHaveLength(120)
    expect(rows[119]!.balanceAfter).toBe(0)
    const sumPay = rows.reduce((a, r) => a + r.payment, 0)
    expect(sumPay).toBe(1_200_000)
  })

  it('referansesak: 4,5M, 4,79 % nominell, 30 år (standard annuitet)', () => {
    const monthly = annuityMonthlyPayment(4_500_000, 4.79, 30)
    expect(monthly).toBe(23_583)

    expect(totalPaidOverTerm(monthly, 30)).toBe(23_583 * 360)

    const schedule = buildAmortizationSchedule(4_500_000, 4.79, 30)
    expect(schedule).toHaveLength(360)
    expect(schedule[359]!.balanceAfter).toBe(0)
    const sumSchedule = sumSchedulePayments(schedule)
    expect(sumSchedule).toBeGreaterThanOrEqual(4_500_000)
    expect(Math.abs(sumSchedule - monthly * 360)).toBeLessThan(500)
  })

  it('effektiv årsrente fra nominell (månedlig forrentning)', () => {
    const eff = effectiveAnnualRateFromNominalMonthly(4.79)
    expect(eff).toBeCloseTo(4.899, 2)
  })

  it('sumScheduleInterest samsvarer omtrent med avdrag+renter for referansesak', () => {
    const schedule = buildAmortizationSchedule(4_500_000, 4.79, 30)
    const interest = sumScheduleInterest(schedule)
    const paid = sumSchedulePayments(schedule)
    expect(interest + 4_500_000).toBeCloseTo(paid, 0) // siste-termin avrunding
  })

  it('monthlyPaymentForNominalWithDelta: høyere rente gir høyere termin, delta klippet til tak', () => {
    const base = annuityMonthlyPayment(1_000_000, 4, 25)
    const up1 = monthlyPaymentForNominalWithDelta(1_000_000, 4, 25, 1)
    const up2 = monthlyPaymentForNominalWithDelta(1_000_000, 4, 25, 2)
    expect(up1).toBeGreaterThan(base)
    expect(up2).toBeGreaterThan(up1)
    const atCap = monthlyPaymentForNominalWithDelta(1_000_000, 14.5, 25, 2, 0, 15)
    expect(atCap).toBe(annuityMonthlyPayment(1_000_000, 15, 25))
  })

  it('firstYearInterestShareOfPayments er mellom 0 og 100', () => {
    const schedule = buildAmortizationSchedule(4_500_000, 4.79, 30)
    const share = firstYearInterestShareOfPayments(schedule)
    expect(share).toBeGreaterThan(0)
    expect(share).toBeLessThan(100)
  })

  it('firstYearInterestShare: kort lån bruker færre enn 12 rader', () => {
    const schedule = buildAmortizationSchedule(100_000, 5, 0.5)
    expect(schedule.length).toBe(6)
    const share = firstYearInterestShareOfPayments(schedule)
    expect(share).toBeGreaterThanOrEqual(0)
    expect(share).toBeLessThanOrEqual(100)
  })
})
