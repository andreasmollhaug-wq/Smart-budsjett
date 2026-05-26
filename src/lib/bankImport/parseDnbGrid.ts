import { BANK_IMPORT_MAX_DATA_ROWS } from '@/lib/bankImport/bankImport.constants'
import { buildBankRowMappingKeys } from '@/lib/bankImport/bankMappingKeys'
import { normalizeBankHeaderCell } from '@/lib/bankImport/headerNormalize'
import { resolveBankInnUtAmounts } from '@/lib/bankImport/parseBankColumnAmount'
import type { BankParseRowError, BankParsedRow, ParseBankFileResult } from '@/lib/bankImport/types'

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

function parseYyyyMmDdToIso(raw: string): string | null {
  const t = raw.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (!m) return null
  const year = parseInt(m[1]!, 10)
  const month = parseInt(m[2]!, 10)
  const day = parseInt(m[3]!, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return t
}

export function parseBankDateFlexible(raw: string): string | null {
  if (!raw.trim()) return null
  const iso = parseYyyyMmDdToIso(raw)
  if (iso) return iso
  return parseDdMmYyyyToIso(raw)
}

function findDnbColumnMap(headerCells: string[]) {
  const norm = headerCells.map((c) => normalizeBankHeaderCell(c))
  const date = norm.findIndex((n) => n === 'dato')
  const forklaring = norm.findIndex((n) => n === 'forklaring')
  const rentedato = norm.findIndex((n) => n === 'rentedato')
  const ut = norm.findIndex(
    (n) => n === 'ut fra konto' || (n.includes('ut fra') && n.includes('konto')),
  )
  const inn = norm.findIndex(
    (n) =>
      n === 'inn pa konto' ||
      (n.includes('inn') && n.includes('pa') && n.includes('konto')),
  )
  if (date < 0 || forklaring < 0 || ut < 0 || inn < 0) return null
  return {
    date,
    forklaring,
    rentedato: rentedato >= 0 ? rentedato : null,
    ut,
    inn,
  }
}

/**
 * Tolker DNB/Sbanken-tabell som 2D-strenger (header funnet automatisk blant første 30 rader).
 */
export function parseDnbGrid(grid: string[][], fileLineOffset = 0): ParseBankFileResult {
  const rows: BankParsedRow[] = []
  const rowErrors: BankParseRowError[] = []

  let headerIdx = -1
  let colMap: NonNullable<ReturnType<typeof findDnbColumnMap>> | null = null

  const maxScan = Math.min(grid.length, 30)
  for (let i = 0; i < maxScan; i++) {
    const cells = grid[i] ?? []
    const map = findDnbColumnMap(cells)
    if (map) {
      headerIdx = i
      colMap = map
      break
    }
  }

  if (!colMap || headerIdx < 0) {
    return {
      rows: [],
      rowErrors: [
        {
          fileLine: fileLineOffset + 1,
          reason: 'empty_row',
          detail:
            'Fant ikke DNB/Sbanken-overskrifter (Dato, Forklaring, Ut fra konto, Inn på konto).',
        },
      ],
    }
  }

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const fileLine = i + 1 + fileLineOffset
    if (rows.length >= BANK_IMPORT_MAX_DATA_ROWS) {
      rowErrors.push({
        fileLine,
        reason: 'empty_row',
        detail: `Maks ${BANK_IMPORT_MAX_DATA_ROWS} rader.`,
      })
      break
    }

    const cells = grid[i] ?? []
    const get = (idx: number) => (idx >= 0 && idx < cells.length ? String(cells[idx]).trim() : '')

    const dateRaw = get(colMap.date)
    const forklaringRaw = get(colMap.forklaring)
    const rentedatoRaw = colMap.rentedato !== null ? get(colMap.rentedato) : ''
    const utRaw = get(colMap.ut)
    const innRaw = get(colMap.inn)

    if (!dateRaw && !forklaringRaw && !utRaw && !innRaw && !rentedatoRaw) {
      continue
    }

    const dateIso = parseBankDateFlexible(dateRaw)
    if (!dateIso) {
      rowErrors.push({ fileLine, reason: 'invalid_date', detail: dateRaw })
      continue
    }

    if (!forklaringRaw) {
      rowErrors.push({ fileLine, reason: 'missing_description' })
      continue
    }

    const amountResult = resolveBankInnUtAmounts(utRaw, innRaw)
    if (!amountResult.ok) {
      if (amountResult.reason === 'empty') continue
      rowErrors.push({
        fileLine,
        reason: amountResult.reason,
        ...(amountResult.detail ? { detail: amountResult.detail } : {}),
      })
      continue
    }
    const { amount, transactionType } = amountResult
    const { primaryKey: mappingKey, legacyKey: mappingKeyLegacy } = buildBankRowMappingKeys(
      forklaringRaw,
      transactionType,
    )

    let rentedatoIso: string | undefined
    if (rentedatoRaw) {
      const r = parseBankDateFlexible(rentedatoRaw)
      if (r) rentedatoIso = r
    }

    rows.push({
      fileLine,
      dateIso,
      ...(rentedatoIso ? { rentedatoIso } : {}),
      forklaringRaw,
      mappingKey,
      mappingKeyLegacy,
      amount,
      transactionType,
    })
  }

  return { rows, rowErrors }
}
