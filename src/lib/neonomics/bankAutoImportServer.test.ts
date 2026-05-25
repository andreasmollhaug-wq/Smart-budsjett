import { describe, expect, it } from 'vitest'
import { buildTransactionsFromBankRows } from '@/lib/bankImport/buildTransactionsFromBankRows'
import { resolveBankMappingCategoryName } from '@/lib/bankImport/bankMappingKeys'
import type { BankParsedRow } from '@/lib/bankImport/types'

describe('bankAutoImport mapping split', () => {
  const row: BankParsedRow = {
    fileLine: 1,
    dateIso: '2026-05-01',
    forklaringRaw: 'Butikk',
    mappingKey: 'butikk',
    mappingKeyLegacy: 'butikk',
    amount: 100,
    transactionType: 'expense',
  }

  it('skiller mapped og unmapped', () => {
    const maps = { butikk: { categoryName: 'Mat' } }
    const cat = resolveBankMappingCategoryName(maps, row)
    expect(cat).toBe('Mat')
    const unmapped = resolveBankMappingCategoryName({}, row)
    expect(unmapped ?? null).toBeNull()
  })

  it('bygger transaksjon når mapping finnes', () => {
    const maps = { butikk: { categoryName: 'Mat' } }
    const getCategoryName = (r: BankParsedRow) => resolveBankMappingCategoryName(maps, r)
    const cats = [
      {
        id: 'c1',
        name: 'Mat',
        type: 'expense' as const,
        parentCategory: 'utgifter' as const,
        color: '#000',
        frequency: 'monthly' as const,
        budgeted: Array(12).fill(0),
        spent: 0,
      },
    ]
    const res = buildTransactionsFromBankRows([row], getCategoryName, cats, 'p1', 'run1')
    expect(res.transactions).toHaveLength(1)
    expect(res.skippedUnmapped).toBe(0)
  })
})
