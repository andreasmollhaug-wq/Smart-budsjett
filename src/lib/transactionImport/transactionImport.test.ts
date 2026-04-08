import { describe, expect, it } from 'vitest'
import { parseTransactionCsvText, splitCsvLine } from '@/lib/transactionImport/parseTransactionCsv'
import {
  collectUnknownCategoryNames,
  countPotentialDuplicateRows,
  resolveCategoryForImport,
} from '@/lib/transactionImport/resolveImportCategories'
import type { BudgetCategory } from '@/lib/store'
import type { ParsedTransactionRow } from '@/lib/transactionImport/parseTransactionCsv'

const expenseCat = (name: string): BudgetCategory => ({
  id: 'x',
  name,
  budgeted: Array(12).fill(0),
  spent: 0,
  type: 'expense',
  color: '#000',
  parentCategory: 'utgifter',
  frequency: 'monthly',
})

describe('splitCsvLine', () => {
  it('handles semicolon and quotes', () => {
    expect(splitCsvLine('a;b;c', ';')).toEqual(['a', 'b', 'c'])
    expect(splitCsvLine('"a;b";c', ';')).toEqual(['a;b', 'c'])
  })
})

describe('parseTransactionCsvText', () => {
  it('parses semicolon CSV with header on row 2', () => {
    const csv = `Registrer ting
DATO;TRANSAKSJON;KATEGORI;BELØP;Beskrivelse
01.01.25;Regning;Husleie;13 000;
02.01.25;Utgift;Mat & dagligvarer;590;Butikk
`
    const r = parseTransactionCsvText(csv)
    expect(r.rowErrors.filter((e) => e.detail?.includes('Maks'))).toHaveLength(0)
    expect(r.rows).toHaveLength(2)
    expect(r.rows[0]!.dateIso).toBe('2025-01-01')
    expect(r.rows[0]!.categoryRaw).toBe('Husleie')
    expect(r.rows[0]!.amount).toBe(13000)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[1]!.description).toBe('Butikk')
    expect(r.rows[1]!.transactionType).toBe('expense')
  })

  it('sets transactionType and parentCategoryHint from TRANSAKSJON column', () => {
    const csv = `DATO;TRANSAKSJON;KATEGORI;BELØP
01.01.25;Inntekt;Lønn;50000
02.01.25;Regning;Husleie;13000
03.01.25;Utgift;Mat;500
04.01.25;Gjeld;Billån;5000
05.01.25;Sparing;BSU;2000
`
    const r = parseTransactionCsvText(csv)
    expect(r.rows).toHaveLength(5)
    expect(r.rows[0]!.transactionType).toBe('income')
    expect(r.rows[0]!.parentCategoryHint).toBe('inntekter')
    expect(r.rows[1]!.transactionType).toBe('expense')
    expect(r.rows[1]!.parentCategoryHint).toBe('regninger')
    expect(r.rows[2]!.transactionType).toBe('expense')
    expect(r.rows[2]!.parentCategoryHint).toBe('utgifter')
    expect(r.rows[3]!.transactionType).toBe('expense')
    expect(r.rows[3]!.parentCategoryHint).toBe('gjeld')
    expect(r.rows[4]!.transactionType).toBe('expense')
    expect(r.rows[4]!.parentCategoryHint).toBe('sparing')
  })

  it('strips BOM', () => {
    const bom = '\uFEFF'
    const csv = `${bom}DATO;TRANSAKSJON;KATEGORI;BELØP
01.02.25;x;Transport;100
`
    const r = parseTransactionCsvText(csv)
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]!.dateIso).toBe('2025-02-01')
  })

  it('uses fifth column as description when header has only four named columns', () => {
    const csv = `DATO;TRANSAKSJON;KATEGORI;BELØP
03.01.25;Regning;Abonnementer;299;Spotify + iCloud
`
    const r = parseTransactionCsvText(csv)
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]!.description).toBe('Spotify + iCloud')
  })

  it('detects comma delimiter', () => {
    const csv = `DATO,TRANSAKSJON,KATEGORI,BELØP
01.01.25,x,Transport,200
`
    const r = parseTransactionCsvText(csv)
    expect(r.delimiter).toBe(',')
    expect(r.rows[0]!.amount).toBe(200)
  })

  it('records invalid rows', () => {
    const csv = `DATO;TRANSAKSJON;KATEGORI;BELØP
xx;y;Mat;100
01.01.25;y;;100
`
    const r = parseTransactionCsvText(csv)
    expect(r.rows.length).toBeGreaterThanOrEqual(0)
    expect(r.rowErrors.some((e) => e.reason === 'invalid_date')).toBe(true)
    expect(r.rowErrors.some((e) => e.reason === 'missing_category')).toBe(true)
  })
})

describe('resolveCategoryForImport', () => {
  const picker = [expenseCat('Husleie'), expenseCat('Mat & dagligvarer')]

  it('matches case-insensitive', () => {
    const r = resolveCategoryForImport('husleie', picker)
    expect(r.kind).toBe('matched')
    if (r.kind === 'matched') expect(r.canonical).toBe('Husleie')
  })

  it('returns unknown for missing', () => {
    expect(resolveCategoryForImport('Finnes ikke', picker).kind).toBe('unknown')
  })
})

describe('collectUnknownCategoryNames', () => {
  it('collects unique unknowns', () => {
    const rows: ParsedTransactionRow[] = [
      { fileLine: 2, dateIso: '2025-01-01', categoryRaw: 'A', amount: 1, description: '', transactionType: 'expense', parentCategoryHint: 'utgifter' },
      { fileLine: 3, dateIso: '2025-01-02', categoryRaw: 'A', amount: 2, description: '', transactionType: 'expense', parentCategoryHint: 'utgifter' },
      { fileLine: 4, dateIso: '2025-01-03', categoryRaw: 'B', amount: 3, description: '', transactionType: 'expense', parentCategoryHint: 'utgifter' },
    ]
    const u = collectUnknownCategoryNames(rows, [expenseCat('Husleie')])
    expect(u).toEqual(['A', 'B'])
  })
})

describe('countPotentialDuplicateRows', () => {
  it('counts overlapping keys', () => {
    const rows: ParsedTransactionRow[] = [
      { fileLine: 2, dateIso: '2025-01-01', categoryRaw: 'Husleie', amount: 100, description: 'x', transactionType: 'expense', parentCategoryHint: 'regninger' },
    ]
    const existing = [
      { date: '2025-01-01', amount: 100, description: 'x', category: 'Husleie' },
    ]
    const n = countPotentialDuplicateRows(
      rows,
      () => 'Husleie',
      existing,
    )
    expect(n).toBe(1)
  })
})
