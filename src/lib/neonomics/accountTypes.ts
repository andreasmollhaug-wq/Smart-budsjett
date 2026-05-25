import type { NeonomicsAccount } from '@/lib/neonomics/accounts'

/** Lagret på bank_connections.accounts_cache (jsonb). */
export type BankAccountCacheEntry = {
  id: string
  iban?: string
  displayName?: string
  accountName?: string
  lastSyncAt?: string | null
  lastFetchedCount?: number
  lastImportedCount?: number
  lastPendingCount?: number
  lastDuplicateCount?: number
}

export type SyncPerAccountMeta = {
  accountId: string
  label: string
  fetchedCount: number
  importedCount?: number
  pendingCount?: number
  duplicateCount?: number
  error?: string
}

export function accountLabelFromNeonomics(account: NeonomicsAccount): string {
  const name = account.displayName?.trim() || account.accountName?.trim()
  if (name) return name
  const iban = maskIban(account.iban)
  if (iban) return iban
  return 'Bankkonto'
}

export function maskIban(iban: string | undefined): string | null {
  const raw = iban?.replace(/\s/g, '').trim()
  if (!raw || raw.length < 8) return raw ?? null
  return `${raw.slice(0, 4)} •••• ${raw.slice(-4)}`
}

export function accountsToCacheSnapshot(accounts: NeonomicsAccount[]): BankAccountCacheEntry[] {
  return accounts.map((a) => ({
    id: a.id,
    iban: a.iban,
    displayName: a.displayName,
    accountName: a.accountName,
    lastSyncAt: null,
  }))
}

export function mergeAccountsCache(
  previous: BankAccountCacheEntry[],
  accountsFromApi: NeonomicsAccount[],
): BankAccountCacheEntry[] {
  const prevById = new Map(previous.map((e) => [e.id, e]))
  return accountsFromApi.map((a) => {
    const prev = prevById.get(a.id)
    return {
      id: a.id,
      iban: a.iban ?? prev?.iban,
      displayName: a.displayName ?? prev?.displayName,
      accountName: a.accountName ?? prev?.accountName,
      lastSyncAt: prev?.lastSyncAt ?? null,
      lastFetchedCount: prev?.lastFetchedCount,
      lastImportedCount: prev?.lastImportedCount,
      lastPendingCount: prev?.lastPendingCount,
      lastDuplicateCount: prev?.lastDuplicateCount,
    }
  })
}

export function applyPerAccountStatsToCache(
  cache: BankAccountCacheEntry[],
  perAccount: SyncPerAccountMeta[],
  syncedAt: string,
): BankAccountCacheEntry[] {
  const statsById = new Map(perAccount.map((p) => [p.accountId, p]))
  return cache.map((entry) => {
    const stats = statsById.get(entry.id)
    if (!stats) return entry
    return {
      ...entry,
      lastSyncAt: syncedAt,
      lastFetchedCount: stats.fetchedCount,
      lastImportedCount: stats.importedCount ?? entry.lastImportedCount,
      lastPendingCount: stats.pendingCount ?? entry.lastPendingCount,
      lastDuplicateCount: stats.duplicateCount ?? entry.lastDuplicateCount,
    }
  })
}
