import { splitCsvLine } from '@/lib/transactionImport/parseTransactionCsv'
import { LEDGER_IMPORT_MAX_DATA_ROWS, LEDGER_IMPORT_MAX_FILE_BYTES } from '@/lib/ledgerImport/ledgerImport.constants'
import { parseLedgerAmountCell } from '@/lib/ledgerImport/parseAmountLedger'
import { roundMoney2 } from '@/lib/money/parseNorwegianAmount'
import type {
  CanonicalLedgerLine,
  LedgerCsvProfile,
  LedgerParseRowError,
  ParseLedgerCsvResult,
} from '@/lib/ledgerImport/types'

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1)
  return text
}

function normalizeHeaderCell(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0308/g, '')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/å/g, 'aa')
}

function detectDelimiter(line: string): ';' | ',' {
  const semi = (line.match(/;/g) ?? []).length
  const comma = (line.match(/,/g) ?? []).length
  return semi >= comma ? ';' : ','
}

function parseDateToIso(raw: string, format: LedgerCsvProfile['dateFormat']): string | null {
  const t = raw.trim()
  if (format === 'yyyy-MM-dd') {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
    if (!m) return null
    const year = parseInt(m[1]!, 10)
    const month = parseInt(m[2]!, 10)
    const day = parseInt(m[3]!, 10)
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    const d = new Date(year, month - 1, day)
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }
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

function headerMatches(cell: string, candidates: string[] | undefined): boolean {
  if (!candidates?.length) return false
  const n = normalizeHeaderCell(cell)
  return candidates.some((c) => normalizeHeaderCell(c) === n)
}

function findColumnIndex(headerCells: string[], candidates: string[] | undefined): number {
  if (!candidates?.length) return -1
  for (let i = 0; i < headerCells.length; i++) {
    if (headerMatches(headerCells[i]!, candidates)) return i
  }
  return -1
}

/**
 * Velg dato-kolonne: foretrekk eksplisitt «Dato» når den finnes, ellers første treff blant
 * bilagsdato/posteringsdato osv. Unngår at IB-linjer med tom «Dato» får dato fra «Bilagsdato».
 */
function findLedgerDateColumnIndex(headerCells: string[], profile: LedgerCsvProfile): number {
  const all = profile.headers.date
  if (!all?.length) return -1
  const datoCol = findColumnIndex(headerCells, ['dato'])
  if (datoCol >= 0) return datoCol
  return findColumnIndex(headerCells, all)
}

function normalizeLedgerDateCell(raw: string | undefined): string {
  return (raw ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2007/g, ' ')
    .replace(/\u202F/g, ' ')
    .trim()
}

/** Tom celle eller typiske plassholdere / saldo-merking — ikke ekte bilagsdato. */
function isMissingOrPlaceholderLedgerDate(normalized: string): boolean {
  if (!normalized) return true
  const u = normalized.toLowerCase()
  if (u === '-' || u === '–' || u === '—' || u === '...' || u === '..' || u === '.') return true
  if (
    u === 'n/a' ||
    u === 'na' ||
    u === 'null' ||
    u === 'none' ||
    u === '#n/a' ||
    u === '#value!' ||
    u === '#value' ||
    u === '#null!'
  ) {
    return true
  }
  if (u === 'ib' || u === 'ub') return true
  if (/^(ib|ub|i\.b\.|u\.b\.)$/i.test(normalized)) return true
  if (u.includes('inngående') || u.includes('inngaende') || u.includes('utgående') || u.includes('utgaende')) {
    return true
  }
  if (/^[\s\-–—./\\#_?]+$/.test(normalized)) return true
  return false
}

function normalizeVoucherCell(raw: string | undefined): string {
  return (raw ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2007/g, ' ')
    .replace(/\u202F/g, ' ')
    .trim()
}

function isEmptyOrPlaceholderVoucher(normalized: string): boolean {
  if (!normalized) return true
  const u = normalized.toLowerCase()
  if (u === '-' || u === '–' || u === '—' || u === '...' || u === '..' || u === '.') return true
  if (
    u === 'n/a' ||
    u === 'na' ||
    u === 'null' ||
    u === 'none' ||
    u === '#n/a' ||
    u === '#value!' ||
    u === '#value' ||
    u === '#null!'
  ) {
    return true
  }
  if (/^[\s\-–—./\\#_?]+$/.test(normalized)) return true
  return false
}

export function normalizeLedgerAccountCode(raw: string): string {
  return raw.replace(/\s+/g, '').trim()
}

/** Ledende siffer som kontonummer; resten som navn (Conta «1500 Kundefordring»). */
export function extractLeadingNumberAccount(raw: string): { code: string; nameFromCell: string } | null {
  const t = raw.trim()
  const m = /^(\d+)/.exec(t)
  if (!m) return null
  const code = m[1]!
  const nameFromCell = t.slice(m[0].length).trim()
  return { code, nameFromCell }
}

function parseAccountFromRow(
  accRaw: string,
  profile: LedgerCsvProfile,
): { code: string; nameFromCell: string } | null {
  const mode = profile.accountCodeExtract ?? 'compact'
  if (mode === 'compact') {
    const code = normalizeLedgerAccountCode(accRaw)
    return code ? { code, nameFromCell: '' } : null
  }
  return extractLeadingNumberAccount(accRaw)
}

function accountNumberForMinFilter(accountCode: string): number | null {
  const m = /^(\d+)/.exec(accountCode.trim())
  if (!m) return null
  const n = parseInt(m[1]!, 10)
  return Number.isFinite(n) ? n : null
}

function inferLedgerSideDebitCredit(
  debit: number,
  credit: number,
  incomeOnSide: 'credit' | 'debit',
): 'income' | 'expense' | null {
  const d = debit > 0 ? debit : 0
  const c = credit > 0 ? credit : 0
  if (d > 0 && c > 0) return null
  if (d === 0 && c === 0) return null
  if (incomeOnSide === 'credit') {
    if (c > 0) return 'income'
    return 'expense'
  }
  if (d > 0) return 'income'
  return 'expense'
}

export function parseLedgerCsvText(text: string, profile: LedgerCsvProfile): ParseLedgerCsvResult {
  const stripped = stripBom(text)
  const byteLen = new TextEncoder().encode(stripped).length
  if (byteLen > LEDGER_IMPORT_MAX_FILE_BYTES) {
    return {
      lines: [],
      heldBackLines: [],
      rowErrors: [{ fileLine: 0, reason: 'invalid_amount', detail: 'Filen er for stor (maks 5 MB).' }],
      delimiter: profile.delimiter,
    }
  }

  const lines = stripped.split(/\r\n|\n|\r/).filter((l, i, arr) => {
    if (i === arr.length - 1 && l === '') return false
    return true
  })

  if (lines.length === 0) {
    return {
      lines: [],
      heldBackLines: [],
      rowErrors: [{ fileLine: 0, reason: 'invalid_date', detail: 'Tom fil.' }],
      delimiter: profile.delimiter,
    }
  }

  const firstNonEmptyIdx = lines.findIndex((l) => l.trim() !== '')
  if (firstNonEmptyIdx < 0) {
    return {
      lines: [],
      heldBackLines: [],
      rowErrors: [{ fileLine: 0, reason: 'invalid_date', detail: 'Tom fil.' }],
      delimiter: profile.delimiter,
    }
  }

  const headerIdx = firstNonEmptyIdx
  const headerLine = lines[headerIdx]!
  const delimiter = detectDelimiter(headerLine)
  const headerCells = splitCsvLine(headerLine, delimiter)

  const ixDate = findLedgerDateColumnIndex(headerCells, profile)
  const ixAcc = findColumnIndex(headerCells, profile.headers.accountCode)
  const ixName = profile.headers.accountName
    ? findColumnIndex(headerCells, profile.headers.accountName)
    : -1
  const ixVoucher = profile.headers.voucherRef
    ? findColumnIndex(headerCells, profile.headers.voucherRef)
    : -1
  const ixDesc = profile.headers.description
    ? findColumnIndex(headerCells, profile.headers.description)
    : -1
  const ixDebet = profile.headers.debit ? findColumnIndex(headerCells, profile.headers.debit) : -1
  const ixCredit = profile.headers.credit ? findColumnIndex(headerCells, profile.headers.credit) : -1
  const ixAmount = profile.headers.amount ? findColumnIndex(headerCells, profile.headers.amount) : -1

  const headerFileLine = headerIdx + 1

  if (ixDate < 0 || ixAcc < 0) {
    return {
      lines: [],
      heldBackLines: [],
      rowErrors: [
        {
          fileLine: headerFileLine,
          reason: 'missing_account',
          detail: 'Fant ikke påkrevde kolonner (dato og konto). Sjekk overskriftsrad og skilletegn.',
        },
      ],
      delimiter,
    }
  }

  if (profile.amountModel === 'debitCredit' && (ixDebet < 0 || ixCredit < 0)) {
    return {
      lines: [],
      heldBackLines: [],
      rowErrors: [
        {
          fileLine: headerFileLine,
          reason: 'missing_account',
          detail: 'Profilen krever Debet- og Kredit-kolonner — fant ikke begge.',
        },
      ],
      delimiter,
    }
  }

  if (profile.amountModel === 'singleSigned' && ixAmount < 0) {
    return {
      lines: [],
      heldBackLines: [],
      rowErrors: [
        {
          fileLine: headerFileLine,
          reason: 'missing_account',
          detail: 'Profilen krever beløpkolonne — fant den ikke.',
        },
      ],
      delimiter,
    }
  }

  const incomeOn = profile.incomeOnSide ?? 'credit'
  const amountPrecision = profile.amountPrecision ?? 'integer'
  const linesOut: CanonicalLedgerLine[] = []
  const heldBackOut: { line: CanonicalLedgerLine; reason: 'empty_voucher' }[] = []
  const rowErrors: LedgerParseRowError[] = []

  for (let li = headerIdx + 1; li < lines.length; li++) {
    const line = lines[li]!
    if (!line.trim()) continue
    const fileLine = li + 1
    if (linesOut.length + heldBackOut.length + rowErrors.length >= LEDGER_IMPORT_MAX_DATA_ROWS) {
      rowErrors.push({
        fileLine,
        reason: 'invalid_amount',
        detail: `Maks ${LEDGER_IMPORT_MAX_DATA_ROWS} rader.`,
      })
      break
    }

    const cells = splitCsvLine(line, delimiter)
    const dateNorm = normalizeLedgerDateCell(cells[ixDate])
    const accRaw = cells[ixAcc]?.trim() ?? ''

    if (!dateNorm && !accRaw) continue
    // Tom dato, plassholdere eller saldo-tekst i dato-felt — ikke importer (IB/UB m.m.).
    if (isMissingOrPlaceholderLedgerDate(dateNorm)) continue

    const dateIso = parseDateToIso(dateNorm, profile.dateFormat)
    if (!dateIso) {
      rowErrors.push({ fileLine, reason: 'invalid_date', detail: dateNorm })
      continue
    }

    const parsedAcc = parseAccountFromRow(accRaw, profile)
    if (!parsedAcc) {
      rowErrors.push({ fileLine, reason: 'missing_account', detail: accRaw })
      continue
    }
    const accCode = parsedAcc.code

    if (profile.minAccountNumberInclusive != null) {
      const accNum = accountNumberForMinFilter(accCode)
      if (accNum == null) {
        rowErrors.push({ fileLine, reason: 'missing_account', detail: accRaw })
        continue
      }
      if (accNum < profile.minAccountNumberInclusive) continue
    }

    let amount = 0
    let ledgerSide: 'income' | 'expense'

    if (profile.amountModel === 'debitCredit') {
      const dr =
        parseLedgerAmountCell(cells[ixDebet] ?? '', { allowNegative: false, precision: amountPrecision }) ?? 0
      const cr =
        parseLedgerAmountCell(cells[ixCredit] ?? '', { allowNegative: false, precision: amountPrecision }) ?? 0
      const side = inferLedgerSideDebitCredit(dr, cr, incomeOn)
      if (side === null) {
        if (dr === 0 && cr === 0) {
          rowErrors.push({ fileLine, reason: 'zero_amount' })
        } else {
          rowErrors.push({ fileLine, reason: 'ambiguous_amount', detail: 'Både debet og kredit har beløp.' })
        }
        continue
      }
      amount = Math.max(dr, cr)
      ledgerSide = side
    } else {
      const rawAmt = cells[ixAmount] ?? ''
      const signed = parseLedgerAmountCell(rawAmt, { allowNegative: true, precision: amountPrecision })
      if (signed === null || signed === 0) {
        rowErrors.push({ fileLine, reason: signed === 0 ? 'zero_amount' : 'invalid_amount', detail: rawAmt })
        continue
      }
      amount = Math.abs(signed)
      const expNeg = profile.singleSignedExpenseIsNegative !== false
      ledgerSide = expNeg ? (signed < 0 ? 'expense' : 'income') : signed < 0 ? 'income' : 'expense'
    }

    if (amountPrecision === 'ore') {
      amount = roundMoney2(amount)
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      rowErrors.push({ fileLine, reason: 'invalid_amount' })
      continue
    }

    const nameCol = ixName >= 0 ? (cells[ixName]?.trim() ?? '') : ''
    const accountName = nameCol || parsedAcc.nameFromCell
    const voucherRef = ixVoucher >= 0 ? normalizeVoucherCell(cells[ixVoucher]) : ''
    const description = ixDesc >= 0 ? (cells[ixDesc]?.trim() ?? '') : ''

    const canonical: CanonicalLedgerLine = {
      fileLine,
      dateIso,
      accountCode: accCode,
      accountName,
      voucherRef,
      description,
      amount,
      ledgerSide,
    }

    if (ixVoucher >= 0 && isEmptyOrPlaceholderVoucher(voucherRef)) {
      heldBackOut.push({ line: canonical, reason: 'empty_voucher' })
      continue
    }

    linesOut.push(canonical)
  }

  return { lines: linesOut, heldBackLines: heldBackOut, rowErrors, delimiter }
}
