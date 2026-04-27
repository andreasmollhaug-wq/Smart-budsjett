import type { CanonicalLedgerLine } from '@/lib/ledgerImport/types'

export interface LedgerImportPreviewSummary {
  dateMin: string | null
  dateMax: string | null
  lineCount: number
  totalIncome: number
  totalExpense: number
  uniqueAccountCount: number
  /** antall linjer der kategori ikke er valgt for konto */
  unmappedLineCount: number
}

export function summarizeLedgerLinesForPreview(
  lines: CanonicalLedgerLine[],
  accountToCategory: Record<string, string | undefined>,
): LedgerImportPreviewSummary {
  if (lines.length === 0) {
    return {
      dateMin: null,
      dateMax: null,
      lineCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      uniqueAccountCount: 0,
      unmappedLineCount: 0,
    }
  }
  const dates = lines.map((l) => l.dateIso).sort()
  const accounts = new Set(lines.map((l) => l.accountCode))
  let totalIncome = 0
  let totalExpense = 0
  let unmapped = 0
  for (const l of lines) {
    const cat = accountToCategory[l.accountCode]
    if (!cat?.trim()) unmapped++
    if (l.ledgerSide === 'income') totalIncome += l.amount
    else totalExpense += l.amount
  }
  return {
    dateMin: dates[0] ?? null,
    dateMax: dates[dates.length - 1] ?? null,
    lineCount: lines.length,
    totalIncome,
    totalExpense,
    uniqueAccountCount: accounts.size,
    unmappedLineCount: unmapped,
  }
}

export function countPotentialDuplicateLedgerLines(
  lines: CanonicalLedgerLine[],
  categoryForAccount: (accountCode: string) => string | null,
  existingTransactions: { date: string; amount: number; description: string; category: string }[],
): number {
  const existingSet = new Set(
    existingTransactions.map((t) =>
      `${t.date}|${t.amount}|${(t.description ?? '').trim()}|${t.category}`,
    ),
  )
  let n = 0
  for (const l of lines) {
    const cat = categoryForAccount(l.accountCode)
    if (!cat) continue
    const desc = [l.voucherRef, l.description, l.accountName].filter(Boolean).join(' — ')
    const key = `${l.dateIso}|${l.amount}|${desc.trim()}|${cat}`
    if (existingSet.has(key)) n++
  }
  return n
}
