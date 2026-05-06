import type { ParseBankFileResult } from '@/lib/bankImport/types'
import { BANK_IMPORT_MAX_FILE_BYTES } from '@/lib/bankImport/bankImport.constants'
import { formatBankCellValue } from '@/lib/bankImport/bankGridCellFormat'
import { parseSparebank1Grid } from '@/lib/bankImport/parseSparebank1Grid'
import { splitCsvLine } from '@/lib/transactionImport/parseTransactionCsv'

function detectDelimiter(line: string): ';' | ',' {
  const semi = (line.match(/;/g) ?? []).length
  const comma = (line.match(/,/g) ?? []).length
  return semi >= comma ? ';' : ','
}

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1)
  return text
}

/**
 * Sparebank 1 eksportert som CSV (samme kolonner som typisk xlsx-eksport).
 */
export function parseSparebank1CsvText(text: string): ParseBankFileResult {
  const stripped = stripBom(text)
  const byteLen = new TextEncoder().encode(stripped).length
  if (byteLen > BANK_IMPORT_MAX_FILE_BYTES) {
    return {
      rows: [],
      rowErrors: [{ fileLine: 0, reason: 'empty_row', detail: 'Filen er for stor (maks 5 MB).' }],
    }
  }

  const lines = stripped.split(/\r\n|\n|\r/).filter((l, i, arr) => {
    if (i === arr.length - 1 && l === '') return false
    return true
  })

  if (lines.length === 0) {
    return { rows: [], rowErrors: [{ fileLine: 0, reason: 'empty_row', detail: 'Tom fil.' }] }
  }

  const firstNonEmpty = lines.find((l) => l.trim()) ?? lines[0]!
  const delimiter = detectDelimiter(firstNonEmpty)
  const grid = lines.map((line) => splitCsvLine(line, delimiter))
  return parseSparebank1Grid(grid, 0)
}

/**
 * Leser .xlsx (første ark) som Sparebank 1-posteringer.
 */
export async function parseSparebank1XlsxBuffer(buf: ArrayBuffer): Promise<ParseBankFileResult> {
  if (buf.byteLength > BANK_IMPORT_MAX_FILE_BYTES) {
    return {
      rows: [],
      rowErrors: [{ fileLine: 0, reason: 'empty_row', detail: 'Filen er for stor (maks 5 MB).' }],
    }
  }

  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buf)

  const ws = workbook.worksheets[0]
  if (!ws) {
    return {
      rows: [],
      rowErrors: [{ fileLine: 0, reason: 'empty_row', detail: 'Ingen ark i filen.' }],
    }
  }

  const rowCount = Math.max(ws.rowCount, ws.actualRowCount ?? 0)
  const grid: string[][] = []

  for (let r = 1; r <= rowCount; r++) {
    const row = ws.getRow(r)
    const maxCol = Math.max(row.cellCount, 12)
    const values: string[] = []
    for (let c = 1; c <= maxCol; c++) {
      const cell = row.getCell(c)
      values.push(formatBankCellValue(cell.value))
    }
    grid.push(values)
  }

  return parseSparebank1Grid(grid, 0)
}
