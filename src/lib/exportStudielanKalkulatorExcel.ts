import type { AmortizationRow } from '@/lib/mortgageCalculator'
import type { StudentLoanScheduleResult, TermComparisonRow } from '@/lib/studentLoanCalculator'

export type StudielanExcelExportInput = {
  principal: number
  nominalRatePct: number
  years: number
  graceMonths: number
  studyYears?: number
  annualLoanAmount?: number
  grantConversionPct?: number
  result: StudentLoanScheduleResult
  termComparison: TermComparisonRow[]
  budgetImpact?: { expensePct: number | null; incomePct: number | null }
}

function downloadBlob(buffer: ArrayBuffer, filename: string, mime: string) {
  const blob = new Blob([buffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportStudielanKalkulatorExcel(
  input: StudielanExcelExportInput,
  filename: string,
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dottir'
  wb.created = new Date()

  const { result, termComparison } = input

  const summary = wb.addWorksheet('Oppsummering')
  summary.addRow(['Studielånskalkulator — Dottir'])
  summary.addRow(['Eksportert', new Date().toLocaleString('nb-NO')])
  summary.addRow([])
  summary.addRow(['Input'])
  summary.addRow(['Restgjeld ved oppstart (kr)', input.principal])
  summary.addRow(['Rente per år (%)', input.nominalRatePct])
  summary.addRow(['Nedbetalingstid (år)', input.years])
  summary.addRow(['Måneder rente uten betaling før termin', input.graceMonths])
  if (input.studyYears != null) {
    summary.addRow(['Studieår (estimat)', input.studyYears])
    summary.addRow(['Lån per år (kr)', input.annualLoanAmount ?? 0])
    summary.addRow(['Stipend-omgjøring (%)', input.grantConversionPct ?? 0])
  }
  summary.addRow([])
  summary.addRow(['Resultat'])
  summary.addRow(['Hovedstol ved første termin (kr)', result.principalAtRepaymentStart])
  summary.addRow(['Kapitalisert rente i grace (kr)', result.graceInterestCapitalized])
  summary.addRow(['Månedlig betaling (kr)', result.monthlyPayment])
  summary.addRow(['Effektiv årsrente (%)', result.effectiveAnnualRatePct])
  summary.addRow(['Totalt tilbakebetalt (kr)', result.totalPaid])
  summary.addRow(['Totale rentekostnader (kr)', result.totalInterest])
  summary.addRow(['Andel renter første år (%)', result.firstYearInterestSharePct])
  if (input.budgetImpact) {
    summary.addRow([])
    summary.addRow(['Budsjett'])
    if (input.budgetImpact.expensePct != null) {
      summary.addRow(['Andel av budsjetterte utgifter (%)', input.budgetImpact.expensePct])
    }
    if (input.budgetImpact.incomePct != null) {
      summary.addRow(['Andel av netto inntekt (%)', input.budgetImpact.incomePct])
    }
  }

  const compare = wb.addWorksheet('Sammenligning')
  compare.addRow(['År', 'Månedlig (kr)', 'Totalt tilbakebetalt (kr)', 'Renter totalt (kr)', 'Besparelse i renter (kr)'])
  for (const row of termComparison) {
    compare.addRow([row.years, row.monthlyPayment, row.totalPaid, row.totalInterest, row.interestSavedVsSelected])
  }

  const yearly = wb.addWorksheet('Plan per år')
  yearly.addRow(['År', 'Snitt månedlig (kr)', 'Renter (kr)', 'Avdrag (kr)', 'Restgjeld (kr)'])
  for (const row of result.yearlySchedule) {
    yearly.addRow([
      row.yearIndex,
      row.avgMonthlyPayment,
      row.interestPaid,
      row.principalPaid,
      row.balanceAfter,
    ])
  }

  const monthly = wb.addWorksheet('Plan per måned')
  monthly.addRow(['Mnd', 'Termin (kr)', 'Renter (kr)', 'Avdrag (kr)', 'Restgjeld (kr)'])
  for (const row of result.schedule) {
    monthly.addRow([row.monthIndex, row.payment, row.interest, row.principal, row.balanceAfter])
  }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(buffer as ArrayBuffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

/** Server-side / test helper uten DOM. */
export async function buildStudielanKalkulatorExcelBuffer(
  input: StudielanExcelExportInput,
): Promise<ArrayBuffer> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const summary = wb.addWorksheet('Oppsummering')
  summary.addRow(['Månedlig betaling', input.result.monthlyPayment])
  const compare = wb.addWorksheet('Sammenligning')
  compare.addRow(['År', 'Månedlig'])
  for (const row of input.termComparison) {
    compare.addRow([row.years, row.monthlyPayment])
  }
  const yearly = wb.addWorksheet('Plan per år')
  yearly.addRow(['År'])
  for (const row of input.result.yearlySchedule) {
    yearly.addRow([row.yearIndex])
  }
  const monthly = wb.addWorksheet('Plan per måned')
  monthly.addRow(['Mnd'])
  for (const row of input.result.schedule as AmortizationRow[]) {
    monthly.addRow([row.monthIndex])
  }
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>
}
