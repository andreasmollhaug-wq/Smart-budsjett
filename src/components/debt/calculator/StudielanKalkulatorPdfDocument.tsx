'use client'

import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { CALCULATOR_PDF_CAPTURE_ROOT_ID } from '@/lib/exportCalculatorPdf'
import type { StudentLoanScheduleResult, TermComparisonRow } from '@/lib/studentLoanCalculator'

type Props = {
  title: string
  principal: number
  nominalRatePct: number
  years: number
  graceMonths: number
  studyYears: number
  annualLoanAmount: number
  grantConversionPct: number
  estimatedFromStudy: number
  result: StudentLoanScheduleResult
  termComparison: TermComparisonRow[]
  budgetExpensePct: number | null
  budgetIncomePct: number | null
}

export default function StudielanKalkulatorPdfDocument({
  title,
  principal,
  nominalRatePct,
  years,
  graceMonths,
  studyYears,
  annualLoanAmount,
  grantConversionPct,
  estimatedFromStudy,
  result,
  termComparison,
  budgetExpensePct,
  budgetIncomePct,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()

  return (
    <div
      id={CALCULATOR_PDF_CAPTURE_ROOT_ID}
      className="fixed left-[-9999px] top-0 w-[794px] p-8 bg-white text-black pointer-events-none"
      aria-hidden
    >
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      <p className="text-sm text-gray-600 mb-4">
        Eksportert {new Date().toLocaleString('nb-NO')} — forenklet modell, ikke offisiell Lånekassen-beregning.
      </p>

      <h2 className="text-base font-semibold mt-4 mb-2">Input</h2>
      <table className="text-sm w-full mb-4">
        <tbody>
          <tr><td className="pr-4 py-0.5">Restgjeld ved oppstart</td><td>{formatNOK(principal)}</td></tr>
          <tr><td className="pr-4 py-0.5">Rente per år</td><td>{nominalRatePct.toLocaleString('nb-NO')} %</td></tr>
          <tr><td className="pr-4 py-0.5">Nedbetalingstid</td><td>{years} år</td></tr>
          <tr><td className="pr-4 py-0.5">Måneder rente uten betaling</td><td>{graceMonths}</td></tr>
          <tr><td className="pr-4 py-0.5">Studieår (estimat)</td><td>{studyYears}</td></tr>
          <tr><td className="pr-4 py-0.5">Lån per år</td><td>{formatNOK(annualLoanAmount)}</td></tr>
          <tr><td className="pr-4 py-0.5">Stipend-omgjøring</td><td>{grantConversionPct} %</td></tr>
          <tr><td className="pr-4 py-0.5">Estimert restgjeld fra studier</td><td>{formatNOK(estimatedFromStudy)}</td></tr>
        </tbody>
      </table>

      <h2 className="text-base font-semibold mt-4 mb-2">Nøkkeltall</h2>
      <table className="text-sm w-full mb-4">
        <tbody>
          <tr><td className="pr-4 py-0.5">Månedlig betaling</td><td className="font-semibold">{formatNOK(result.monthlyPayment)}</td></tr>
          <tr><td className="pr-4 py-0.5">Hovedstol ved første termin</td><td>{formatNOK(result.principalAtRepaymentStart)}</td></tr>
          <tr><td className="pr-4 py-0.5">Kapitalisert rente (grace)</td><td>{formatNOK(result.graceInterestCapitalized)}</td></tr>
          <tr><td className="pr-4 py-0.5">Totalt tilbakebetalt</td><td>{formatNOK(result.totalPaid)}</td></tr>
          <tr><td className="pr-4 py-0.5">Totale rentekostnader</td><td>{formatNOK(result.totalInterest)}</td></tr>
          <tr><td className="pr-4 py-0.5">Effektiv årsrente</td><td>{result.effectiveAnnualRatePct.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} %</td></tr>
          {budgetExpensePct != null && (
            <tr><td className="pr-4 py-0.5">Andel av budsjetterte utgifter</td><td>{budgetExpensePct.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} %</td></tr>
          )}
          {budgetIncomePct != null && (
            <tr><td className="pr-4 py-0.5">Andel av netto inntekt</td><td>{budgetIncomePct.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} %</td></tr>
          )}
        </tbody>
      </table>

      <h2 className="text-base font-semibold mt-4 mb-2">Sammenligning nedbetalingstid</h2>
      <table className="text-sm w-full mb-4 border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 pr-2">År</th>
            <th className="text-right py-1 pr-2">Månedlig</th>
            <th className="text-right py-1 pr-2">Renter totalt</th>
            <th className="text-right py-1">Besparelse</th>
          </tr>
        </thead>
        <tbody>
          {termComparison.map((row) => (
            <tr key={row.years} className="border-b border-gray-200">
              <td className="py-1 pr-2">{row.years}{row.years === years ? ' *' : ''}</td>
              <td className="text-right py-1 pr-2">{formatNOK(row.monthlyPayment)}</td>
              <td className="text-right py-1 pr-2">{formatNOK(row.totalInterest)}</td>
              <td className="text-right py-1">
                {row.interestSavedVsSelected === 0 ? '—' : formatNOK(Math.abs(row.interestSavedVsSelected))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-base font-semibold mt-4 mb-2">Amortiseringsplan per år</h2>
      <table className="text-sm w-full mb-4 border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 pr-2">År</th>
            <th className="text-right py-1 pr-2">Snitt pr. md.</th>
            <th className="text-right py-1 pr-2">Renter</th>
            <th className="text-right py-1 pr-2">Avdrag</th>
            <th className="text-right py-1">Restgjeld</th>
          </tr>
        </thead>
        <tbody>
          {result.yearlySchedule.map((row) => (
            <tr key={row.yearIndex} className="border-b border-gray-200">
              <td className="py-1 pr-2">{row.yearIndex}</td>
              <td className="text-right py-1 pr-2">{formatNOK(row.avgMonthlyPayment)}</td>
              <td className="text-right py-1 pr-2">{formatNOK(row.interestPaid)}</td>
              <td className="text-right py-1 pr-2">{formatNOK(row.principalPaid)}</td>
              <td className="text-right py-1">{formatNOK(row.balanceAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-6">
        Forenklet annuitetsmodell. Faktisk rente og avtale hos Lånekassen gjelder. Ikke finans- eller skatteråd.
      </p>
    </div>
  )
}
