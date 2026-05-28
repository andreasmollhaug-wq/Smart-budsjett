import { describe, expect, it } from 'vitest'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import { buildBudgetPlanExcelBuffer } from './downloadBudgetPlanExcel'
import type { BudgetPlanExportInput } from './types'

describe('downloadBudgetPlanExcel', () => {
  it('genererer xlsx med ett ark per scope for all', async () => {
    const labels = emptyLabelLists()
    const input: BudgetPlanExportInput = {
      year: 2026,
      layout: 'fullYear',
      monthIndex: 0,
      onlyLinesWithAmounts: false,
      generatedAt: new Date('2026-01-15T12:00:00'),
      scopes: [
        {
          key: 'household',
          label: 'Husholdning (samlet)',
          categories: [],
          labelLists: labels,
        },
        {
          key: 'p1',
          label: 'Ola',
          categories: [],
          labelLists: labels,
        },
      ],
    }

    const buffer = await buildBudgetPlanExcelBuffer(input)
    expect(buffer.byteLength).toBeGreaterThan(1000)

    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    expect(wb.worksheets.length).toBe(2)
  }, 30_000)
})
