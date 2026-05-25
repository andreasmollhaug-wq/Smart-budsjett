import { describe, expect, it } from 'vitest'
import { buildStudielanKalkulatorExcelBuffer } from './exportStudielanKalkulatorExcel'
import { buildStudentLoanSchedule, compareRepaymentTerms } from './studentLoanCalculator'

describe('exportStudielanKalkulatorExcel', () => {
  it('genererer xlsx med fire ark', async () => {
    const result = buildStudentLoanSchedule({
      principal: 400_000,
      nominalAnnualRatePct: 5.5,
      years: 20,
      graceMonths: 0,
    })
    const termComparison = compareRepaymentTerms(400_000, 5.5, 20)

    const buffer = await buildStudielanKalkulatorExcelBuffer({
      principal: 400_000,
      nominalRatePct: 5.5,
      years: 20,
      graceMonths: 0,
      result,
      termComparison,
    })

    expect(buffer.byteLength).toBeGreaterThan(1000)

    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      'Oppsummering',
      'Sammenligning',
      'Plan per år',
      'Plan per måned',
    ])
    expect(wb.getWorksheet('Plan per måned')!.rowCount).toBeGreaterThan(200)
  })
})
