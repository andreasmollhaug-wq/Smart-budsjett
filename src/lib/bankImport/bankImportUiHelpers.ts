import { resolveBankMappingCategoryName } from '@/lib/bankImport/bankMappingKeys'
import type { BankImportMappingRule, BankParsedRow } from '@/lib/bankImport/types'

/** Mulige duplikater som ved malimport: samme dato, beløp, beskrivelse og kategori. */
export function countPotentialDuplicateBankRows(
  rows: BankParsedRow[],
  getCategoryName: (row: BankParsedRow) => string | null,
  existingTransactions: { date: string; amount: number; description: string; category: string }[],
): number {
  const existingSet = new Set(
    existingTransactions.map((t) =>
      `${t.date}|${t.amount}|${(t.description ?? '').trim()}|${t.category}`,
    ),
  )
  let n = 0
  for (const r of rows) {
    const cat = getCategoryName(r)
    if (!cat) continue
    const key = `${r.dateIso}|${r.amount}|${r.forklaringRaw.trim()}|${cat}`
    if (existingSet.has(key)) n++
  }
  return n
}

export interface BankMappingAggregateRow {
  mappingKey: string
  transactionType: 'income' | 'expense'
  exampleForklaring: string
  rowCount: number
  sumAmount: number
}

export function buildBankMappingAggregates(rows: BankParsedRow[]): BankMappingAggregateRow[] {
  const m = new Map<
    string,
    {
      mappingKey: string
      transactionType: 'income' | 'expense'
      exampleForklaring: string
      rowCount: number
      sumAmount: number
    }
  >()

  for (const r of rows) {
    const cur = m.get(r.mappingKey)
    if (!cur) {
      m.set(r.mappingKey, {
        mappingKey: r.mappingKey,
        transactionType: r.transactionType,
        exampleForklaring: r.forklaringRaw,
        rowCount: 1,
        sumAmount: r.amount,
      })
    } else {
      cur.rowCount += 1
      cur.sumAmount += r.amount
    }
  }

  return [...m.values()].sort((a, b) =>
    a.exampleForklaring.localeCompare(b.exampleForklaring, 'nb'),
  )
}

export function normalizeBankMappingSearchText(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLocaleLowerCase('nb')
}

export function bankMappingSearchMatchesRow(row: BankParsedRow, query: string): boolean {
  const q = normalizeBankMappingSearchText(query)
  if (!q) return true
  return normalizeBankMappingSearchText(row.forklaringRaw).includes(q)
}

export function filterBankAggregatesBySearch(
  aggregates: BankMappingAggregateRow[],
  rows: BankParsedRow[],
  query: string,
): BankMappingAggregateRow[] {
  const q = normalizeBankMappingSearchText(query)
  if (!q) return aggregates
  return aggregates.filter((a) => {
    if (normalizeBankMappingSearchText(a.exampleForklaring).includes(q)) return true
    return rows.some((r) => r.mappingKey === a.mappingKey && bankMappingSearchMatchesRow(r, query))
  })
}

export function rowsForMappingKey(rows: BankParsedRow[], mappingKey: string): BankParsedRow[] {
  return rows
    .filter((r) => r.mappingKey === mappingKey)
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.fileLine - b.fileLine)
}

export function buildBankRowsByMappingKey(rows: BankParsedRow[]): Map<string, BankParsedRow[]> {
  const m = new Map<string, BankParsedRow[]>()
  for (const r of rows) {
    const list = m.get(r.mappingKey)
    if (list) list.push(r)
    else m.set(r.mappingKey, [r])
  }
  for (const [key, list] of m) {
    list.sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.fileLine - b.fileLine)
    m.set(key, list)
  }
  return m
}

export function resolveBankRowCategoryName(
  row: BankParsedRow,
  maps: Record<string, BankImportMappingRule | undefined> | undefined,
  overridesByFileLine: Record<number, string> | undefined,
): string | undefined {
  const override = overridesByFileLine?.[row.fileLine]?.trim()
  if (override) return override
  return resolveBankMappingCategoryName(maps, row)
}

export function isBankRowCategoryValid(
  row: BankParsedRow,
  categoryName: string | undefined,
  pickerCategories: { name: string; type: 'income' | 'expense' }[],
): boolean {
  const name = categoryName?.trim()
  if (!name) return false
  const c = pickerCategories.find((x) => x.name === name)
  return !!c && c.type === row.transactionType
}

export function isBankRowMapped(
  row: BankParsedRow,
  maps: Record<string, BankImportMappingRule | undefined> | undefined,
  overridesByFileLine: Record<number, string> | undefined,
  pickerCategories: { name: string; type: 'income' | 'expense' }[],
): boolean {
  return isBankRowCategoryValid(
    row,
    resolveBankRowCategoryName(row, maps, overridesByFileLine),
    pickerCategories,
  )
}

export function aggregateMappingComplete(
  aggregate: BankMappingAggregateRow,
  rows: BankParsedRow[],
  maps: Record<string, BankImportMappingRule | undefined> | undefined,
  overridesByFileLine: Record<number, string> | undefined,
  pickerCategories: { name: string; type: 'income' | 'expense' }[],
): boolean {
  const childRows = rows.filter((r) => r.mappingKey === aggregate.mappingKey)
  if (childRows.length === 0) return false
  return childRows.every((r) => isBankRowMapped(r, maps, overridesByFileLine, pickerCategories))
}

export function countUnmappedBankRows(
  rows: BankParsedRow[],
  maps: Record<string, BankImportMappingRule | undefined> | undefined,
  overridesByFileLine: Record<number, string> | undefined,
  pickerCategories: { name: string; type: 'income' | 'expense' }[],
): number {
  let n = 0
  for (const r of rows) {
    if (!isBankRowMapped(r, maps, overridesByFileLine, pickerCategories)) n++
  }
  return n
}
