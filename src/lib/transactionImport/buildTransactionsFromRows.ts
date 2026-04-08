import type { Transaction } from '@/lib/store'
import { generateId } from '@/lib/utils'
import type { ParsedTransactionRow } from '@/lib/transactionImport/parseTransactionCsv'

/**
 * Bygger transaksjoner for import. Type (inntekt/utgift) hentes fra TRANSAKSJON-kolonnen i CSV, ikke fra kategorien.
 * Hopper over rader der kategori ikke kan resolves til kanonisk navn.
 */
export function buildTransactionsFromImportRows(
  rows: ParsedTransactionRow[],
  canonicalNameForCategoryRaw: (categoryRaw: string) => string | null,
  profileId: string,
): Transaction[] {
  const out: Transaction[] = []
  for (const r of rows) {
    const canonical = canonicalNameForCategoryRaw(r.categoryRaw)
    if (!canonical) continue
    out.push({
      id: generateId(),
      date: r.dateIso,
      description: r.description,
      amount: r.amount,
      category: canonical,
      type: r.transactionType,
      profileId,
    })
  }
  return out
}
