import type { BudgetCategory, Transaction } from '@/lib/store'
import { plannedFollowUpForNewTransaction } from '@/lib/plannedTransactions'
import { generateId } from '@/lib/utils'
import type { CanonicalLedgerLine, LedgerImportLineSnapshot } from '@/lib/ledgerImport/types'
import { categoryByNameMap } from '@/lib/ledgerImport/types'

export interface BuildLedgerTxResult {
  transactions: Transaction[]
  skippedUnmapped: number
  skippedUnknownCategory: number
  importedLineSnapshots: LedgerImportLineSnapshot[]
}

/**
 * Bygger transaksjoner fra hovedbokslinjer. Type (inntekt/utgift) kommer fra valgt kategori, ikke fra ledgerSide.
 */
export function buildTransactionsFromLedgerLines(
  lines: CanonicalLedgerLine[],
  accountToCategoryName: Record<string, string | undefined>,
  pickerCategories: BudgetCategory[],
  profileId: string,
  ledgerImportRunId?: string,
): BuildLedgerTxResult {
  const byName = categoryByNameMap(pickerCategories)
  const txs: Transaction[] = []
  const importedLineSnapshots: LedgerImportLineSnapshot[] = []
  let skippedUnmapped = 0
  let skippedUnknownCategory = 0

  for (const l of lines) {
    const catName = accountToCategoryName[l.accountCode]?.trim()
    if (!catName) {
      skippedUnmapped++
      continue
    }
    const cat = byName.get(catName)
    if (!cat) {
      skippedUnknownCategory++
      continue
    }
    const txType = cat.type
    const desc = [l.voucherRef, l.description, l.accountName].filter(Boolean).join(' — ') || `Konto ${l.accountCode}`
    const pf = plannedFollowUpForNewTransaction(l.dateIso)
    importedLineSnapshots.push({
      fileLine: l.fileLine,
      dateIso: l.dateIso,
      amount: l.amount,
      accountCode: l.accountCode,
      accountName: l.accountName,
      voucherRef: l.voucherRef,
      description: l.description,
      transactionDescription: desc,
      categoryName: cat.name,
      type: txType,
      ledgerSide: l.ledgerSide,
    })
    txs.push({
      id: generateId(),
      date: l.dateIso,
      description: desc,
      amount: l.amount,
      category: cat.name,
      type: txType,
      profileId,
      ...(ledgerImportRunId ? { ledgerImportRunId } : {}),
      ...(pf ? { plannedFollowUp: true } : {}),
    })
  }

  return { transactions: txs, skippedUnmapped, skippedUnknownCategory, importedLineSnapshots }
}
