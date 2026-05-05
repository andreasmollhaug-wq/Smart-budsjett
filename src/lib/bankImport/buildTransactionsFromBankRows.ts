import type { BudgetCategory, Transaction } from '@/lib/store'
import { plannedFollowUpForNewTransaction } from '@/lib/plannedTransactions'
import { generateId } from '@/lib/utils'
import { categoryByNameMap } from '@/lib/ledgerImport/types'
import type { BankImportLineSnapshot, BankParsedRow } from '@/lib/bankImport/types'

export interface BuildBankTxResult {
  transactions: Transaction[]
  skippedUnmapped: number
  skippedUnknownCategory: number
  skippedTypeMismatch: number
  importedLineSnapshots: BankImportLineSnapshot[]
}

/**
 * Bygger transaksjoner fra bankparserte rader. Kategori må matche radens inntekt/utgift.
 */
export function buildTransactionsFromBankRows(
  rows: BankParsedRow[],
  getCategoryName: (row: BankParsedRow) => string | undefined,
  pickerCategories: BudgetCategory[],
  profileId: string,
  bankImportRunId?: string,
): BuildBankTxResult {
  const byName = categoryByNameMap(pickerCategories)
  const txs: Transaction[] = []
  const importedLineSnapshots: BankImportLineSnapshot[] = []
  let skippedUnmapped = 0
  let skippedUnknownCategory = 0
  let skippedTypeMismatch = 0

  for (const r of rows) {
    const catName = getCategoryName(r)?.trim()
    if (!catName) {
      skippedUnmapped++
      continue
    }
    const cat = byName.get(catName)
    if (!cat) {
      skippedUnknownCategory++
      continue
    }
    if (cat.type !== r.transactionType) {
      skippedTypeMismatch++
      continue
    }

    const desc = r.forklaringRaw.trim()
    const pf = plannedFollowUpForNewTransaction(r.dateIso)
    importedLineSnapshots.push({
      fileLine: r.fileLine,
      dateIso: r.dateIso,
      ...(r.rentedatoIso ? { rentedatoIso: r.rentedatoIso } : {}),
      forklaringRaw: r.forklaringRaw,
      amount: r.amount,
      categoryName: cat.name,
      type: cat.type,
      transactionDescription: desc,
    })
    txs.push({
      id: generateId(),
      date: r.dateIso,
      description: desc,
      amount: r.amount,
      category: cat.name,
      type: cat.type,
      profileId,
      ...(bankImportRunId ? { bankImportRunId } : {}),
      ...(pf ? { plannedFollowUp: true } : {}),
    })
  }

  return {
    transactions: txs,
    skippedUnmapped,
    skippedUnknownCategory,
    skippedTypeMismatch,
    importedLineSnapshots,
  }
}
