import type { BankAccountCacheEntry } from '@/lib/neonomics/accountTypes'

import type { BankConnectionRow } from '@/lib/neonomics/bankConnectionsRepo'

import { parseAccountsCache, syncAccountIdsFromConnection } from '@/lib/neonomics/syncAccounts'



export type NeonomicsConnectionStatusDto = {

  id: string

  profileId: string

  bankId: string

  connected: boolean

  consentOk: boolean

  bankDisplayName: string

  /** @deprecated Bruk syncAccountIds / accounts */

  selectedAccountId: string | null

  syncAccountIds: string[]

  accounts: BankAccountCacheEntry[]

  lastSyncAt: string | null

  lastSyncFetchedCount: number | null

  lastSyncError: string | null

  autoSyncEnabled: boolean

  pendingUnmappedCount: number

}



export function connectionToStatusDto(conn: BankConnectionRow): NeonomicsConnectionStatusDto {

  return {

    id: conn.id,

    profileId: conn.profile_id,

    bankId: conn.bank_id,

    connected: true,

    consentOk: !!conn.consent_ok_at,

    bankDisplayName: conn.bank_display_name,

    selectedAccountId: conn.selected_account_id,

    syncAccountIds: syncAccountIdsFromConnection(conn),

    accounts: parseAccountsCache(conn.accounts_cache),

    lastSyncAt: conn.last_sync_at,

    lastSyncFetchedCount: conn.last_sync_fetched_count,

    lastSyncError: conn.last_sync_error,

    autoSyncEnabled: conn.auto_sync_enabled ?? false,

    pendingUnmappedCount: conn.pending_unmapped_count ?? 0,

  }

}


