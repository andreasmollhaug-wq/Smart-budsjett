import type { BankAccountCacheEntry } from '@/lib/neonomics/accountTypes'
import type { NeonomicsAccount } from '@/lib/neonomics/accounts'
import type { BankConnectionRow } from '@/lib/neonomics/bankConnectionsRepo'

/**
 * Hvilke Neonomics account.id som skal hentes.
 * Tom sync_account_ids → alle kontoer fra API.
 * Ellers snitt med API (ukjente ids droppes).
 */
export function resolveAccountsToSync(
  conn: Pick<BankConnectionRow, 'sync_account_ids'>,
  accountsFromApi: NeonomicsAccount[],
): NeonomicsAccount[] {
  const apiIds = new Set(accountsFromApi.map((a) => a.id))
  const configured = conn.sync_account_ids ?? []
  if (configured.length === 0) {
    return accountsFromApi
  }
  const selected = configured.filter((id) => apiIds.has(id))
  return accountsFromApi.filter((a) => selected.includes(a.id))
}

export function syncAccountIdsFromConnection(
  conn: Pick<BankConnectionRow, 'sync_account_ids' | 'selected_account_id'>,
): string[] {
  const ids = conn.sync_account_ids ?? []
  if (ids.length > 0) return ids
  if (conn.selected_account_id?.trim()) return [conn.selected_account_id.trim()]
  return []
}

export function countPendingByAccountId(
  rows: { externalBankAccountId?: string }[],
): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    const id = r.externalBankAccountId?.trim()
    if (!id) continue
    m.set(id, (m.get(id) ?? 0) + 1)
  }
  return m
}

export function countImportedByAccountId(
  txs: { externalBankAccountId?: string; externalBankProvider?: string }[],
): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of txs) {
    if (t.externalBankProvider !== 'neonomics') continue
    const id = t.externalBankAccountId?.trim()
    if (!id) continue
    m.set(id, (m.get(id) ?? 0) + 1)
  }
  return m
}

export function parseAccountsCache(raw: unknown): BankAccountCacheEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is BankAccountCacheEntry =>
      e != null && typeof e === 'object' && typeof (e as BankAccountCacheEntry).id === 'string',
  )
}
