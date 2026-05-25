import { buildBankRowMappingKeys } from '@/lib/bankImport/bankMappingKeys'
import type { BankParsedRow } from '@/lib/bankImport/types'
import type { NeonomicsTransaction } from '@/lib/neonomics/transactions'

export type NeonomicsSyncRow = BankParsedRow & {
  externalBankTxId: string
}

function transactionTypeFromIndicator(indicator: string | undefined): 'income' | 'expense' {
  return indicator === 'CRDT' ? 'income' : 'expense'
}

function dateIsoFromBooking(bookingDate: string | undefined): string {
  if (!bookingDate) return new Date().toISOString().slice(0, 10)
  const d = new Date(bookingDate)
  if (Number.isNaN(d.getTime())) return bookingDate.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function descriptionFromTx(tx: NeonomicsTransaction): string {
  const ref = tx.transactionReference?.trim() ?? ''
  const cp = tx.counterpartyName?.trim() ?? ''
  if (cp && ref) return `${cp} — ${ref}`
  return cp || ref || 'Banktransaksjon'
}

function amountFromTx(tx: NeonomicsTransaction): number {
  const raw = tx.transactionAmount?.value
  const n = raw != null ? Number.parseFloat(String(raw)) : NaN
  if (!Number.isFinite(n)) return 0
  return Math.abs(n)
}

export type MapNeonomicsRowsAccountContext = {
  accountId: string
  accountLabel: string
  fileLineStart?: number
}

export function mapNeonomicsTransactionsToSyncRows(
  transactions: NeonomicsTransaction[],
  account?: MapNeonomicsRowsAccountContext,
): NeonomicsSyncRow[] {
  const rows: NeonomicsSyncRow[] = []
  let line = account?.fileLineStart ?? 0
  for (const tx of transactions) {
    const id = tx.id?.trim()
    if (!id) continue
    line += 1
    const transactionType = transactionTypeFromIndicator(tx.creditDebitIndicator)
    const forklaringRaw = descriptionFromTx(tx)
    const { primaryKey, legacyKey } = buildBankRowMappingKeys(forklaringRaw, transactionType)
    rows.push({
      fileLine: line,
      dateIso: dateIsoFromBooking(tx.bookingDate),
      rentedatoIso: tx.valueDate ? dateIsoFromBooking(tx.valueDate) : undefined,
      forklaringRaw,
      mappingKey: primaryKey,
      mappingKeyLegacy: legacyKey,
      amount: amountFromTx(tx),
      transactionType,
      externalBankTxId: id,
      ...(account
        ? {
            externalBankAccountId: account.accountId,
            externalBankAccountLabel: account.accountLabel,
          }
        : {}),
    })
  }
  return rows
}
