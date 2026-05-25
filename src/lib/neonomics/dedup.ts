import type { Transaction } from '@/lib/store'
import type { NeonomicsSyncRow } from '@/lib/neonomics/mapToBankParsedRows'

function dedupKeyForTx(txId: string, accountId?: string): string {
  const id = txId.trim()
  const acc = accountId?.trim()
  return acc ? `${acc}:${id}` : id
}

export function filterNeonomicsRowsNotYetImported(
  rows: NeonomicsSyncRow[],
  existingTransactions: Transaction[],
  profileId: string,
): { rows: NeonomicsSyncRow[]; duplicateCount: number } {
  const existing = new Set<string>()
  for (const t of existingTransactions) {
    if (t.profileId !== profileId) continue
    if (t.externalBankProvider === 'neonomics' && t.externalBankTxId) {
      existing.add(dedupKeyForTx(t.externalBankTxId, t.externalBankAccountId))
    }
  }
  const kept: NeonomicsSyncRow[] = []
  let duplicateCount = 0
  for (const r of rows) {
    const key = dedupKeyForTx(r.externalBankTxId, r.externalBankAccountId)
    if (existing.has(key)) {
      duplicateCount += 1
    } else {
      kept.push(r)
    }
  }
  return { rows: kept, duplicateCount }
}
