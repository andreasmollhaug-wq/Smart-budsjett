import type { BankParsedRow } from '@/lib/bankImport/types'

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
