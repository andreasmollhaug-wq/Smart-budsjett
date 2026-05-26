import { describe, expect, it } from 'vitest'
import { buildTransactionsFromBankRows } from '@/lib/bankImport/buildTransactionsFromBankRows'
import { buildMappingStorageKey } from '@/lib/bankImport/buildMappingStorageKey'
import { buildBankRowMappingKeys } from '@/lib/bankImport/bankMappingKeys'
import { normalizeMappingKeyText } from '@/lib/bankImport/normalizeMappingKey'
import { parseDnbGrid } from '@/lib/bankImport/parseDnbGrid'
import { parseDnbSbankenCsvText } from '@/lib/bankImport/parseDnbFile'
import {
  findSparebank1ColumnMap,
  parseSparebank1Grid,
} from '@/lib/bankImport/parseSparebank1Grid'
import { parseSparebank1CsvText } from '@/lib/bankImport/parseSparebank1File'
import {
  parseBankColumnAmount,
  resolveBankInnUtAmounts,
} from '@/lib/bankImport/parseBankColumnAmount'
import type { BudgetCategory } from '@/lib/store'

describe('parseBankColumnAmount', () => {
  it('tolker negativt Ut-beløp som positivt', () => {
    expect(parseBankColumnAmount('-117,8')).toBe(117.8)
  })

  it('beholder positive beløp', () => {
    expect(parseBankColumnAmount('99,50')).toBe(99.5)
  })

  it('returnerer NaN for tom eller bare minus', () => {
    expect(Number.isNaN(parseBankColumnAmount(''))).toBe(true)
    expect(Number.isNaN(parseBankColumnAmount('-'))).toBe(true)
  })

  it('tolker Excel/punktum-desimal med minus', () => {
    expect(parseBankColumnAmount('-117.8')).toBe(117.8)
  })
})

describe('resolveBankInnUtAmounts', () => {
  it('Ut med negativt beløp gir utgift', () => {
    const r = resolveBankInnUtAmounts('-117,8', '')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.transactionType).toBe('expense')
    expect(r.amount).toBe(117.8)
  })
})

describe('normalizeMappingKeyText', () => {
  it('trimmer og kollapser whitespace', () => {
    expect(normalizeMappingKeyText('  a   b  ')).toBe('a b')
  })
})

describe('buildMappingStorageKey', () => {
  it('skiller inntekt og utgift', () => {
    const u = buildMappingStorageKey('Kontoregulering', 'expense')
    const i = buildMappingStorageKey('Kontoregulering', 'income')
    expect(u).not.toBe(i)
    expect(u.startsWith('expense\t')).toBe(true)
    expect(i.startsWith('income\t')).toBe(true)
  })
})

describe('buildBankRowMappingKeys / stabil Giro', () => {
  it('ulike Giro-nummer til samme leverandør gir samme primærnøkkel', () => {
    const a = buildBankRowMappingKeys('Giro 1772 Gudbrandsdal Energi AS Avtalegiro', 'expense')
    const b = buildBankRowMappingKeys('Giro 9999 Gudbrandsdal Energi AS Avtalegiro', 'expense')
    expect(a.primaryKey).toBe(b.primaryKey)
    expect(a.legacyKey).not.toBe(b.legacyKey)
  })

  it('uten Giro beholder samme nøkkel som full normalisering når tekst er kort nok', () => {
    const a = buildBankRowMappingKeys('Kaffe butikk', 'expense')
    expect(a.primaryKey).toBe(buildMappingStorageKey('Kaffe butikk', 'expense'))
    expect(a.legacyKey).toBe(a.primaryKey)
  })
})

describe('parseDnbGrid', () => {
  it('tolker eksempelrader', () => {
    const grid = [
      ['Dato', 'Forklaring', 'Rentedato', 'Ut fra konto', 'Inn på konto'],
      ['5.5.2026', 'Test butikk', '5.5.2026', '100,00', ''],
      ['5.5.2026', 'Lønn', '5.5.2026', '', '1 400,00'],
    ]
    const r = parseDnbGrid(grid, 0)
    expect(r.rows.length).toBe(2)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[0]!.amount).toBe(100)
    expect(r.rows[1]!.transactionType).toBe('income')
    expect(r.rows[1]!.amount).toBe(1400)
    expect(r.rows[0]!.mappingKeyLegacy).toBeDefined()
    expect(r.rows[0]!.mappingKey).toBeDefined()
  })

  it('flagger tvetydig beløp', () => {
    const grid = [
      ['Dato', 'Forklaring', 'Rentedato', 'Ut fra konto', 'Inn på konto'],
      ['5.5.2026', 'X', '5.5.2026', '10,00', '10,00'],
    ]
    const r = parseDnbGrid(grid, 0)
    expect(r.rows.length).toBe(0)
    expect(r.rowErrors.some((e) => e.reason === 'ambiguous_amount')).toBe(true)
  })

  it('tolker negativt beløp i Ut fra konto', () => {
    const grid = [
      ['Dato', 'Forklaring', 'Rentedato', 'Ut fra konto', 'Inn på konto'],
      ['5.5.2026', 'Butikk', '5.5.2026', '-45,50', ''],
    ]
    const r = parseDnbGrid(grid, 0)
    expect(r.rows.length).toBe(1)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[0]!.amount).toBe(45.5)
  })
})

describe('parseDnbSbankenCsvText', () => {
  it('dekoder semikolon-CSV', () => {
    const csv =
      'Dato;Forklaring;Rentedato;Ut fra konto;Inn på konto\n' +
      '5.5.2026;Kaffe;5.5.2026;45,50;\n'
    const r = parseDnbSbankenCsvText(csv)
    expect(r.rows.length).toBe(1)
    expect(r.rows[0]!.amount).toBe(45.5)
  })
})

describe('findSparebank1ColumnMap', () => {
  it('gjenkjenner standardoverskrifter', () => {
    const m = findSparebank1ColumnMap([
      'Dato',
      'Beskrivelse',
      'Rentedato',
      'Inn',
      'Ut',
      'Til konto',
      'Fra konto',
    ])
    expect(m).not.toBeNull()
    expect(m!.date).toBe(0)
    expect(m!.beskrivelse).toBe(1)
    expect(m!.rentedato).toBe(2)
    expect(m!.inn).toBe(3)
    expect(m!.ut).toBe(4)
  })

  it('returnerer null uten påkrevde kolonner', () => {
    expect(findSparebank1ColumnMap(['Dato', 'Beskrivelse', 'Inn'])).toBeNull()
  })
})

describe('parseSparebank1Grid', () => {
  it('tolker inn/ut og beskrivelse', () => {
    const grid = [
      ['Dato', 'Beskrivelse', 'Rentedato', 'Inn', 'Ut'],
      ['5.5.2026', 'Butikk', '5.5.2026', '', '99,50'],
      ['5.5.2026', 'Lønn', '5.5.2026', '2 000,00', ''],
    ]
    const r = parseSparebank1Grid(grid, 0)
    expect(r.rows.length).toBe(2)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[0]!.amount).toBe(99.5)
    expect(r.rows[1]!.transactionType).toBe('income')
    expect(r.rows[1]!.amount).toBe(2000)
  })

  it('flagger tvetydig beløp', () => {
    const grid = [
      ['Dato', 'Beskrivelse', 'Inn', 'Ut'],
      ['5.5.2026', 'X', '10,00', '10,00'],
    ]
    const r = parseSparebank1Grid(grid, 0)
    expect(r.rows.length).toBe(0)
    expect(r.rowErrors.some((e) => e.reason === 'ambiguous_amount')).toBe(true)
  })

  it('tolker negative Ut fra Sparebank 1-eksport', () => {
    const grid = [
      ['Dato', 'Beskrivelse', 'Rentedato', 'Inn', 'Ut', 'Til konto', 'Fra konto'],
      ['27.02.2026', 'SPAR FRAKKAGJER...', '', '', '-117,8', '', '33303203716'],
      ['27.02.2026', 'Wee.no AS', '', '20625', '', '33303203716', '15200340377'],
    ]
    const r = parseSparebank1Grid(grid, 0)
    expect(r.rows.length).toBe(2)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[0]!.amount).toBe(117.8)
    expect(r.rows[1]!.transactionType).toBe('income')
    expect(r.rows[1]!.amount).toBe(20625)
  })
})

describe('parseSparebank1CsvText', () => {
  it('dekoder semikolon-CSV', () => {
    const csv =
      'Dato;Beskrivelse;Rentedato;Inn;Ut\n' +
      '5.5.2026;Kaffe;5.5.2026;;45,50\n'
    const r = parseSparebank1CsvText(csv)
    expect(r.rows.length).toBe(1)
    expect(r.rows[0]!.amount).toBe(45.5)
    expect(r.rows[0]!.transactionType).toBe('expense')
  })

  it('dekoder komma-CSV med anførselstegn rundt beløp med komma som desimal', () => {
    const csv =
      'Dato,Beskrivelse,Inn,Ut\n' +
      '5.5.2026,Overføring,,"100,00"\n'
    const r = parseSparebank1CsvText(csv)
    expect(r.rows.length).toBe(1)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[0]!.amount).toBe(100)
  })

  it('dekoder semikolon-CSV med negativt Ut-beløp', () => {
    const csv =
      'Dato;Beskrivelse;Rentedato;Inn;Ut\n' +
      '23.02.2026;Vipps*sincere.no;23.02.2026;;-549,1\n'
    const r = parseSparebank1CsvText(csv)
    expect(r.rows.length).toBe(1)
    expect(r.rows[0]!.transactionType).toBe('expense')
    expect(r.rows[0]!.amount).toBe(549.1)
  })
})

describe('buildTransactionsFromBankRows', () => {
  const cats: BudgetCategory[] = [
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

  it('hopper over type mismatch', () => {
    const { primaryKey, legacyKey } = buildBankRowMappingKeys('X', 'income')
    const rows = [
      {
        fileLine: 2,
        dateIso: '2026-05-05',
        forklaringRaw: 'X',
        mappingKey: primaryKey,
        mappingKeyLegacy: legacyKey,
        amount: 100,
        transactionType: 'income' as const,
      },
    ]
    const map = () => 'Mat' // expense category
    const res = buildTransactionsFromBankRows(rows, map, cats, 'p1', 'run1')
    expect(res.transactions.length).toBe(0)
    expect(res.skippedTypeMismatch).toBe(1)
  })

  it('oppretter transaksjon når type matcher', () => {
    const { primaryKey, legacyKey } = buildBankRowMappingKeys('X', 'income')
    const rows = [
      {
        fileLine: 2,
        dateIso: '2026-05-05',
        forklaringRaw: 'X',
        mappingKey: primaryKey,
        mappingKeyLegacy: legacyKey,
        amount: 100,
        transactionType: 'income' as const,
      },
    ]
    const res = buildTransactionsFromBankRows(rows, () => 'Lønn', cats, 'p1', 'run-a')
    expect(res.transactions.length).toBe(1)
    expect(res.transactions[0]!.bankImportRunId).toBe('run-a')
    expect(res.importedLineSnapshots.length).toBe(1)
  })
})
