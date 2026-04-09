import { parseAmountImportNbNo } from '@/lib/transactionImport/parseAmountImportNbNo'
import {
  TRANSACTION_IMPORT_MAX_DATA_ROWS,
  TRANSACTION_IMPORT_MAX_FILE_BYTES,
} from '@/lib/transactionImport/transactionImport.constants'

import type { ParentCategory } from '@/lib/budgetCategoryCatalog'

export type ParsedTransactionRow = {
  /** 1-basert linjenummer i kildefilen. */
  fileLine: number
  dateIso: string
  categoryRaw: string
  amount: number
  description: string
  /** Utledet fra TRANSAKSJON-kolonnen: «Inntekt» → 'income', alt annet → 'expense'. */
  transactionType: 'income' | 'expense'
  /** Budsjettgruppe utledet fra TRANSAKSJON-kolonnen (Regning → regninger, Gjeld → gjeld, osv.). */
  parentCategoryHint: ParentCategory
}

export type ParseRowError = {
  fileLine: number
  reason: 'invalid_date' | 'invalid_amount' | 'missing_category' | 'empty_row'
  detail?: string
}

export type ParseTransactionCsvResult = {
  rows: ParsedTransactionRow[]
  rowErrors: ParseRowError[]
  delimiter: ';' | ','
}

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1)
  return text
}

/** Enkel CSV-linje med støtte for anførselstegn. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && c === delimiter) {
      result.push(cur.trim())
      cur = ''
      continue
    }
    cur += c
  }
  result.push(cur.trim())
  return result
}

function detectDelimiter(line: string): ';' | ',' {
  const semi = (line.match(/;/g) ?? []).length
  const comma = (line.match(/,/g) ?? []).length
  return semi >= comma ? ';' : ','
}

function parseDdMmYyyyToIso(raw: string): string | null {
  const t = raw.trim()
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/.exec(t)
  if (!m) return null
  const day = parseInt(m[1]!, 10)
  const month = parseInt(m[2]!, 10)
  let year = parseInt(m[3]!, 10)
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  if (m[3]!.length === 2) {
    year = year < 70 ? 2000 + year : 1900 + year
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function normalizeHeaderCell(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0308/g, '')
    .replace(/ø/g, 'o')
}

function isHeaderRow(cells: string[]): boolean {
  if (cells.length < 4) return false
  const first = cells[0]?.trim() ?? ''
  if (!/^dato$/i.test(first)) return false
  const norm = cells.map((c) => normalizeHeaderCell(c))
  const hasKategori = norm.some((n) => n === 'kategori')
  const hasBelop = norm.some((n) => n === 'belop' || n === 'beløp')
  return hasKategori && hasBelop
}

function findHeaderRowIndex(lines: string[], delimiter: string): number {
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i]?.trim()
    if (!line) continue
    const cells = splitCsvLine(line, delimiter)
    if (isHeaderRow(cells)) return i
  }
  return -1
}

function columnIndicesFromHeader(cells: string[]): {
  date: number
  transaksjon: number
  kategori: number
  belop: number
  description: number | null
} | null {
  const norm = cells.map((c) => normalizeHeaderCell(c))
  const date = norm.findIndex((n) => n === 'dato')
  const transaksjon = norm.findIndex((n) => n === 'transaksjon')
  const kategori = norm.findIndex((n) => n === 'kategori')
  const belop = norm.findIndex((n) => n === 'belop' || n === 'beløp')
  const beskIndex = norm.findIndex((n) =>
    ['beskrivelse', 'merknad', 'kommentar', 'notat'].includes(n),
  )
  if (date < 0 || kategori < 0 || belop < 0) return null
  let description: number | null = beskIndex >= 0 ? beskIndex : null
  if (description === null && cells.length >= 5) {
    const used = new Set([date, transaksjon, kategori, belop].filter((x) => x >= 0))
    for (let j = 0; j < cells.length; j++) {
      if (!used.has(j) && j !== transaksjon) {
        description = j
        break
      }
    }
    if (description === null) description = 4
  }
  return {
    date,
    transaksjon: transaksjon >= 0 ? transaksjon : -1,
    kategori,
    belop,
    description,
  }
}

function mapTransaksjonToTypeAndParent(raw: string): {
  transactionType: 'income' | 'expense'
  parentCategoryHint: ParentCategory
} {
  const t = raw.trim().toLowerCase()
  if (t === 'inntekt') return { transactionType: 'income', parentCategoryHint: 'inntekter' }
  if (t === 'regning') return { transactionType: 'expense', parentCategoryHint: 'regninger' }
  if (t === 'gjeld') return { transactionType: 'expense', parentCategoryHint: 'gjeld' }
  if (t === 'sparing') return { transactionType: 'expense', parentCategoryHint: 'sparing' }
  return { transactionType: 'expense', parentCategoryHint: 'utgifter' }
}

/**
 * Tolker hele CSV-teksten til strukturerte rader (Excel-mal: DATO, TRANSAKSJON, KATEGORI, BELØP, valgfri beskrivelse).
 */
export function parseTransactionCsvText(text: string): ParseTransactionCsvResult {
  const stripped = stripBom(text)
  const byteLen = new TextEncoder().encode(stripped).length
  if (byteLen > TRANSACTION_IMPORT_MAX_FILE_BYTES) {
    return {
      rows: [],
      rowErrors: [{ fileLine: 0, reason: 'empty_row', detail: 'Filen er for stor (maks 5 MB).' }],
      delimiter: ';',
    }
  }

  const lines = stripped.split(/\r\n|\n|\r/).filter((l, i, arr) => {
    if (i === arr.length - 1 && l === '') return false
    return true
  })

  if (lines.length === 0) {
    return { rows: [], rowErrors: [{ fileLine: 0, reason: 'empty_row', detail: 'Tom fil.' }], delimiter: ';' }
  }

  const delimiter = detectDelimiter(lines.find((l) => l.trim()) ?? lines[0]!)
  const headerIdx = findHeaderRowIndex(lines, delimiter)
  if (headerIdx < 0) {
    return {
      rows: [],
      rowErrors: [
        {
          fileLine: 0,
          reason: 'empty_row',
          detail:
            'Fant ikke overskriftsrad med DATO, KATEGORI og BELØP. Lagre som CSV UTF-8 fra Excel og sjekk første datakolonne.',
        },
      ],
      delimiter,
    }
  }

  const headerCells = splitCsvLine(lines[headerIdx]!, delimiter)
  const cols = columnIndicesFromHeader(headerCells)
  if (!cols) {
    return {
      rows: [],
      rowErrors: [{ fileLine: headerIdx + 1, reason: 'empty_row', detail: 'Ugyldig kolonneoverskrifter.' }],
      delimiter,
    }
  }

  const rows: ParsedTransactionRow[] = []
  const rowErrors: ParseRowError[] = []

  for (let li = headerIdx + 1; li < lines.length; li++) {
    const line = lines[li]!
    if (!line.trim()) continue
    const fileLine = li + 1
    if (rows.length + rowErrors.length >= TRANSACTION_IMPORT_MAX_DATA_ROWS) {
      rowErrors.push({
        fileLine,
        reason: 'empty_row',
        detail: `Maks ${TRANSACTION_IMPORT_MAX_DATA_ROWS} rader.`,
      })
      break
    }

    const cells = splitCsvLine(line, delimiter)
    const dateRaw = cells[cols.date]?.trim() ?? ''
    const catRaw = cells[cols.kategori]?.trim() ?? ''
    const amountRaw = cells[cols.belop]?.trim() ?? ''
    const txTypeRaw = cols.transaksjon >= 0 ? (cells[cols.transaksjon]?.trim() ?? '') : ''
    let descRaw =
      cols.description !== null ? (cells[cols.description]?.trim() ?? '') : ''
    if (cols.description === null && cells.length >= 5) {
      descRaw = (cells[4]?.trim() ?? '') || descRaw
    }

    if (!dateRaw && !catRaw && !amountRaw && !descRaw) {
      continue
    }

    const dateIso = parseDdMmYyyyToIso(dateRaw)
    if (!dateIso) {
      rowErrors.push({ fileLine, reason: 'invalid_date', detail: dateRaw })
      continue
    }

    const amount = parseAmountImportNbNo(amountRaw)
    if (!Number.isFinite(amount)) {
      rowErrors.push({ fileLine, reason: 'invalid_amount', detail: amountRaw })
      continue
    }

    if (!catRaw) {
      rowErrors.push({ fileLine, reason: 'missing_category' })
      continue
    }

    const { transactionType, parentCategoryHint } = mapTransaksjonToTypeAndParent(txTypeRaw)

    rows.push({
      fileLine,
      dateIso,
      categoryRaw: catRaw,
      amount,
      description: descRaw,
      transactionType,
      parentCategoryHint,
    })
  }

  return { rows, rowErrors, delimiter }
}
