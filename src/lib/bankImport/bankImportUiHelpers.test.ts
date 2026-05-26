import { describe, expect, it } from 'vitest'
import { buildBankRowMappingKeys } from '@/lib/bankImport/bankMappingKeys'
import {
  aggregateMappingComplete,
  buildBankMappingAggregates,
  filterBankAggregatesBySearch,
  isBankRowMapped,
  resolveBankRowCategoryName,
  rowsForMappingKey,
} from '@/lib/bankImport/bankImportUiHelpers'
import type { BankParsedRow } from '@/lib/bankImport/types'
import type { BudgetCategory } from '@/lib/store'

function sampleRow(
  overrides: Partial<BankParsedRow> & Pick<BankParsedRow, 'forklaringRaw' | 'transactionType' | 'amount'>,
): BankParsedRow {
  const { primaryKey, legacyKey } = buildBankRowMappingKeys(
    overrides.forklaringRaw,
    overrides.transactionType,
  )
  return {
    fileLine: overrides.fileLine ?? 2,
    dateIso: overrides.dateIso ?? '2026-02-27',
    forklaringRaw: overrides.forklaringRaw,
    mappingKey: overrides.mappingKey ?? primaryKey,
    mappingKeyLegacy: overrides.mappingKeyLegacy ?? legacyKey,
    amount: overrides.amount,
    transactionType: overrides.transactionType,
  }
}

const pickerCategories: BudgetCategory[] = [
  {
    id: 'c1',
    name: 'Mat',
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    color: '#000',
    parentCategory: 'utgifter',
    frequency: 'monthly',
  },
  {
    id: 'c2',
    name: 'Lønn',
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'income',
    color: '#000',
    parentCategory: 'inntekter',
    frequency: 'monthly',
  },
]

describe('filterBankAggregatesBySearch', () => {
  const rows = [
    sampleRow({ forklaringRaw: 'SPAR FRAKKAGJER', transactionType: 'expense', amount: 100, fileLine: 2 }),
    sampleRow({ forklaringRaw: 'Wee.no AS', transactionType: 'income', amount: 200, fileLine: 3 }),
  ]
  const aggregates = buildBankMappingAggregates(rows)

  it('returnerer alle ved tom query', () => {
    expect(filterBankAggregatesBySearch(aggregates, rows, '')).toHaveLength(2)
  })

  it('treffer aggregat-tittel', () => {
    const r = filterBankAggregatesBySearch(aggregates, rows, 'wee')
    expect(r).toHaveLength(1)
    expect(r[0]!.exampleForklaring).toBe('Wee.no AS')
  })

  it('treffer underliggende forklaringRaw', () => {
    const r = filterBankAggregatesBySearch(aggregates, rows, 'frakkagjer')
    expect(r).toHaveLength(1)
    expect(r[0]!.exampleForklaring).toBe('SPAR FRAKKAGJER')
  })
})

describe('resolveBankRowCategoryName', () => {
  const row = sampleRow({ forklaringRaw: 'Butikk', transactionType: 'expense', amount: 50 })

  it('override slår aggregat-mapping', () => {
    const maps = { [row.mappingKey]: { categoryName: 'Mat' } }
    expect(resolveBankRowCategoryName(row, maps, { [row.fileLine]: 'Lønn' })).toBe('Lønn')
  })

  it('fallback til bankMaps', () => {
    const maps = { [row.mappingKey]: { categoryName: 'Mat' } }
    expect(resolveBankRowCategoryName(row, maps, {})).toBe('Mat')
  })
})

describe('aggregateMappingComplete', () => {
  it('false når én rad mangler kategori', () => {
    const rows = [
      sampleRow({ forklaringRaw: 'SPAR A', transactionType: 'expense', amount: 10, fileLine: 2 }),
      sampleRow({ forklaringRaw: 'SPAR B', transactionType: 'expense', amount: 20, fileLine: 3 }),
    ]
    const agg = buildBankMappingAggregates(rows)[0]!
    expect(
      aggregateMappingComplete(agg, rows, {}, {}, pickerCategories),
    ).toBe(false)
  })

  it('true når alle rader har gyldig kategori', () => {
    const rows = [
      sampleRow({ forklaringRaw: 'SPAR A', transactionType: 'expense', amount: 10, fileLine: 2 }),
      sampleRow({ forklaringRaw: 'SPAR B', transactionType: 'expense', amount: 20, fileLine: 3 }),
    ]
    const agg = buildBankMappingAggregates(rows)[0]!
    const maps = { [rows[0]!.mappingKey]: { categoryName: 'Mat' } }
    expect(
      aggregateMappingComplete(agg, rows, maps, {}, pickerCategories),
    ).toBe(true)
  })
})

describe('isBankRowMapped', () => {
  it('false ved type mismatch', () => {
    const row = sampleRow({ forklaringRaw: 'X', transactionType: 'expense', amount: 10 })
    const maps = { [row.mappingKey]: { categoryName: 'Lønn' } }
    expect(isBankRowMapped(row, maps, {}, pickerCategories)).toBe(false)
  })
})

describe('rowsForMappingKey', () => {
  it('sorterer etter dato og fileLine', () => {
    const rows = [
      sampleRow({ forklaringRaw: 'SPAR', transactionType: 'expense', amount: 1, fileLine: 5, dateIso: '2026-03-01' }),
      sampleRow({ forklaringRaw: 'SPAR', transactionType: 'expense', amount: 2, fileLine: 3, dateIso: '2026-02-01' }),
    ]
    const key = rows[0]!.mappingKey
    const sorted = rowsForMappingKey(rows, key)
    expect(sorted.map((r) => r.fileLine)).toEqual([3, 5])
  })
})
