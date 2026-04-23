/** Boliglån — annuitet med nominell årsrente delt på 12 per måned. Forenklet modell (ingen gebyrer). */

export type AmortizationRow = {
  monthIndex: number
  payment: number
  interest: number
  principal: number
  balanceAfter: number
}

export function loanToValuePct(loan: number, propertyPrice: number): number {
  if (propertyPrice <= 0) return 0
  return (loan / propertyPrice) * 100
}

export function equityRequired(propertyPrice: number, loan: number): number {
  return Math.max(0, propertyPrice - loan)
}

/** Effektiv årsrente ved månedlig forrentning av nominell årsrente (gebyrer ikke medregnet). */
export function effectiveAnnualRateFromNominalMonthly(nominalAnnualPct: number): number {
  const r = nominalAnnualPct / 100 / 12
  return (Math.pow(1 + r, 12) - 1) * 100
}

export function annuityMonthlyPayment(
  principal: number,
  nominalAnnualRatePct: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0
  const n = Math.max(1, Math.round(years * 12))
  const r = nominalAnnualRatePct / 100 / 12
  if (r === 0) return Math.round(principal / n)
  const pow = Math.pow(1 + r, n)
  const raw = (principal * (r * pow)) / (pow - 1)
  return Math.round(raw)
}

export function totalPaidOverTerm(monthlyPayment: number, years: number): number {
  const n = Math.max(0, Math.round(years * 12))
  return monthlyPayment * n
}

/** Sum faktiske terminer (matcher nedbetalingsplan etter avrunding). */
export function sumSchedulePayments(rows: AmortizationRow[]): number {
  return rows.reduce((a, r) => a + r.payment, 0)
}

/**
 * Nedbetalingsplan med avrunding til hele kroner per måned.
 * Første n−1 terminer bruker samme avrundede annuitet; siste termin justeres (restgjeld + renter).
 */
export function buildAmortizationSchedule(
  principal: number,
  nominalAnnualRatePct: number,
  years: number,
  monthlyPaymentOverride?: number,
): AmortizationRow[] {
  if (principal <= 0 || years <= 0) return []

  const n = Math.max(1, Math.round(years * 12))
  const r = nominalAnnualRatePct / 100 / 12
  const M =
    monthlyPaymentOverride !== undefined
      ? Math.round(monthlyPaymentOverride)
      : annuityMonthlyPayment(principal, nominalAnnualRatePct, years)

  const rows: AmortizationRow[] = []
  let balance = principal

  for (let month = 1; month <= n; month++) {
    const isLast = month === n

    if (isLast) {
      const interest = Math.round(balance * r)
      const payment = balance + interest
      const principalPaid = balance
      balance = 0
      rows.push({
        monthIndex: month,
        payment,
        interest,
        principal: principalPaid,
        balanceAfter: balance,
      })
      break
    }

    const interest = Math.round(balance * r)
    let principalPaid = M - interest
    if (principalPaid > balance) {
      principalPaid = balance
    }
    const payment = principalPaid + interest
    balance = Math.max(0, balance - principalPaid)

    rows.push({
      monthIndex: month,
      payment,
      interest,
      principal: principalPaid,
      balanceAfter: balance,
    })
  }

  return rows
}
