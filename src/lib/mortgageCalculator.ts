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

/** Sum av renter (etter avrunding per måned i planen). */
export function sumScheduleInterest(rows: AmortizationRow[]): number {
  return rows.reduce((a, r) => a + r.interest, 0)
}

const DEFAULT_RATE_FLOOR = 0
const DEFAULT_RATE_CAP = 15

/**
 * Månedlig annuitet ved nominell rente justert med delta (prosentpoeng), avkortet til [minRate, maxRate].
 */
export function monthlyPaymentForNominalWithDelta(
  principal: number,
  nominalAnnualRatePct: number,
  years: number,
  deltaPercentagePoints: number,
  minRate: number = DEFAULT_RATE_FLOOR,
  maxRate: number = DEFAULT_RATE_CAP,
): number {
  const r = Math.min(maxRate, Math.max(minRate, nominalAnnualRatePct + deltaPercentagePoints))
  return annuityMonthlyPayment(principal, r, years)
}

/**
 * Andel av summen av de første 12 (eller færre) betalinger som gikk til renter, i prosent 0–100.
 */
export function firstYearInterestShareOfPayments(rows: AmortizationRow[]): number {
  if (rows.length === 0) return 0
  const n = Math.min(12, rows.length)
  let interest = 0
  let paid = 0
  for (let i = 0; i < n; i++) {
    const row = rows[i]!
    interest += row.interest
    paid += row.payment
  }
  if (paid <= 0) return 0
  return (interest / paid) * 100
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
