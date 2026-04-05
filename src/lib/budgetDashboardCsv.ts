import { REPORT_GROUP_LABELS, type BudgetVsActualRow } from '@/lib/bankReportData'

function escapeCsvCell(s: string): string {
  if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadBudgetVsCsv(
  rows: BudgetVsActualRow[],
  meta: { periodLabel: string; year: number },
): void {
  const header = ['Kategori', 'Gruppe', 'Type', 'Budsjett', 'Faktisk', 'Avvik']
  const lines: string[] = [
    `# Smart Budsjett — ${meta.year} — ${meta.periodLabel}`,
    header.join(';'),
    ...rows.map((r) =>
      [
        escapeCsvCell(r.name),
        escapeCsvCell(REPORT_GROUP_LABELS[r.parentCategory]),
        r.type === 'income' ? 'inntekt' : 'utgift',
        String(Math.round(r.budgeted * 100) / 100).replace('.', ','),
        String(Math.round(r.actual * 100) / 100).replace('.', ','),
        String(Math.round(r.variance * 100) / 100).replace('.', ','),
      ].join(';'),
    ),
  ]
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `budsjett-dashboard-${meta.year}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
