import { BUDGET_MONTH_LABELS } from '@/lib/budgetPeriod'
import { MONTH_LABELS_SHORT_NB, REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import { buildBudgetPlanExportPayload } from './buildBudgetPlanExportPayload'
import { slugifyScopeLabel } from './budgetPlanExportFilenames'
import type { BudgetPlanExportInput } from './types'

function downloadBlob(buffer: ArrayBuffer, filename: string, mime: string) {
  const blob = new Blob([buffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/*?:\[\]]/g, ' ').trim().slice(0, 31) || 'Ark'
  let candidate = base
  let n = 2
  while (used.has(candidate)) {
    const suffix = ` ${n}`
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`
    n += 1
  }
  used.add(candidate)
  return candidate
}

function layoutLabel(layout: BudgetPlanExportInput['layout'], monthIndex: number): string {
  if (layout === 'fullYear') return 'Hele året'
  return BUDGET_MONTH_LABELS[monthIndex] ?? 'Måned'
}

export async function buildBudgetPlanExcelBuffer(input: BudgetPlanExportInput): Promise<ArrayBuffer> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dottir'
  wb.created = input.generatedAt

  const usedSheetNames = new Set<string>()
  const period = layoutLabel(input.layout, input.monthIndex)

  for (const scope of input.scopes) {
    const payload = buildBudgetPlanExportPayload(scope.categories, {
      layout: input.layout,
      monthIndex: input.monthIndex,
      onlyLinesWithAmounts: input.onlyLinesWithAmounts,
      scopeLabel: scope.label,
    })

    const sheetName =
      input.scopes.length === 1
        ? sanitizeSheetName('Budsjettplan', usedSheetNames)
        : sanitizeSheetName(scope.label, usedSheetNames)

    const ws = wb.addWorksheet(sheetName)
    ws.addRow(['Budsjettplan — Dottir'])
    ws.addRow(['Scope', scope.label])
    ws.addRow(['År', input.year])
    ws.addRow(['Periode', period])
    ws.addRow(['Generert', input.generatedAt.toLocaleString('nb-NO')])
    ws.addRow([])
    ws.addRow(['Budsjetterte inntekter', payload.kpis.budgetedIncome])
    ws.addRow(['Budsjetterte kostnader', payload.kpis.budgetedExpense])
    ws.addRow(['Resultat', payload.kpis.budgetResult])
    ws.addRow([])

    const header =
      input.layout === 'fullYear'
        ? ['Gruppe', 'Kategori', 'Type', 'Frekvens', ...MONTH_LABELS_SHORT_NB, 'Sum']
        : ['Gruppe', 'Kategori', 'Type', 'Frekvens', period, 'Sum']
    ws.addRow(header)

    for (const group of REPORT_GROUP_ORDER) {
      for (const row of payload.rowsByGroup[group]) {
        const typeLabel = row.type === 'income' ? 'inntekt' : 'utgift'
        if (input.layout === 'fullYear') {
          ws.addRow([
            row.groupLabel,
            row.name,
            typeLabel,
            row.frequencyLabel,
            ...row.months,
            row.yearTotal,
          ])
        } else {
          ws.addRow([
            row.groupLabel,
            row.name,
            typeLabel,
            row.frequencyLabel,
            row.displayAmount,
            row.displayAmount,
          ])
        }
      }
    }
  }

  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>
}

export async function downloadBudgetPlanExcel(
  input: BudgetPlanExportInput,
  filename: string,
): Promise<void> {
  const buffer = await buildBudgetPlanExcelBuffer(input)
  downloadBlob(
    buffer as ArrayBuffer,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

export { slugifyScopeLabel }
