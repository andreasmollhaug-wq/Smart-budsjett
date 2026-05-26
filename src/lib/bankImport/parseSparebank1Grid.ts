import { BANK_IMPORT_MAX_DATA_ROWS } from '@/lib/bankImport/bankImport.constants'
import { buildBankRowMappingKeys } from '@/lib/bankImport/bankMappingKeys'
import { normalizeBankHeaderCell } from '@/lib/bankImport/headerNormalize'
import { resolveBankInnUtAmounts } from '@/lib/bankImport/parseBankColumnAmount'
import type { BankParseRowError, BankParsedRow, ParseBankFileResult } from '@/lib/bankImport/types'
import { parseBankDateFlexible } from '@/lib/bankImport/parseDnbGrid'

export function findSparebank1ColumnMap(headerCells: string[]) {
  const norm = headerCells.map((c) => normalizeBankHeaderCell(c))
  const date = norm.findIndex((n) => n === 'dato')
  const beskrivelse = norm.findIndex((n) => n === 'beskrivelse')
  const rentedato = norm.findIndex((n) => n === 'rentedato')
  const ut = norm.findIndex((n) => n === 'ut')
  const inn = norm.findIndex((n) => n === 'inn')
  if (date < 0 || beskrivelse < 0 || ut < 0 || inn < 0) return null
  return {
    date,
    beskrivelse,
    rentedato: rentedato >= 0 ? rentedato : null,
    ut,
    inn,
  }
}

/**
 * Tolker Sparebank 1-tabell som 2D-strenger (header funnet automatisk blant første 30 rader).
 */
export function parseSparebank1Grid(grid: string[][], fileLineOffset = 0): ParseBankFileResult {
  const rows: BankParsedRow[] = []
  const rowErrors: BankParseRowError[] = []

  let headerIdx = -1
  let colMap: NonNullable<ReturnType<typeof findSparebank1ColumnMap>> | null = null

  const maxScan = Math.min(grid.length, 30)
  for (let i = 0; i < maxScan; i++) {
    const cells = grid[i] ?? []
    const map = findSparebank1ColumnMap(cells)
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
            'Fant ikke Sparebank 1-overskrifter (Dato, Beskrivelse, Inn, Ut). Valgfrie kolonner: Rentedato, Til konto, Fra konto.',
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
    const forklaringRaw = get(colMap.beskrivelse)
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
