import type { SupabaseClient } from '@supabase/supabase-js'

import type { NextRequest } from 'next/server'

import { applyBankImportToPersistedSlice } from '@/lib/bankImport/applyBankImportToPersistedSlice'

import { buildTransactionsFromBankRows } from '@/lib/bankImport/buildTransactionsFromBankRows'

import { resolveBankMappingCategoryName } from '@/lib/bankImport/bankMappingKeys'

import { getPickerCategoriesForPerson } from '@/lib/bankImport/serverImportHelpers'

import type { BankParsedRow, BankImportRun } from '@/lib/bankImport/types'

import { NEONOMICS_IMPORT_PROFILE_ID } from '@/lib/bankImport/bankImport.constants'

import { bankPendingNeonomicsKey } from '@/lib/neonomics/bankCatalogKeys'

import { bankSourceIdForNeonomicsBank } from '@/lib/neonomics/bankCatalog'

import type { BankConnectionRow } from '@/lib/neonomics/bankConnectionsRepo'

import {

  insertBankSyncLog,

  recordBankSyncResult,

  updateBankConnection,

} from '@/lib/neonomics/bankConnectionsRepo'

import {

  applyPerAccountStatsToCache,

  mergeAccountsCache,

  type SyncPerAccountMeta,

} from '@/lib/neonomics/accountTypes'

import { filterNeonomicsRowsNotYetImported } from '@/lib/neonomics/dedup'

import { runNeonomicsSync } from '@/lib/neonomics/syncFlow'

import { countPendingByAccountId, parseAccountsCache } from '@/lib/neonomics/syncAccounts'

import type { BankPendingNeonomicsPayload } from '@/lib/bankImport/types'

import type { PersistedAppSlice } from '@/lib/store'

import { generateId } from '@/lib/utils'



export type BankAutoImportTrigger = 'cron' | 'manual'



export type BankAutoImportAccountResult = {

  accountId: string

  label: string

  fetched: number

  imported: number

  pending: number

  duplicate: number

  error?: string

}



export type BankAutoImportResult =

  | {

      ok: true

      needsConsent: false

      fetchedCount: number

      importedCount: number

      pendingCount: number

      duplicateCount: number

      skippedUnmapped: number

      accounts: BankAutoImportAccountResult[]

    }

  | { ok: false; needsConsent: true; bankAuthUrl: string; consentUrl: string }

  | { ok: false; needsConsent: false; error: string }



function splitRowsByMapping(

  rows: BankParsedRow[],

  maps: Record<string, { categoryName: string }> | undefined,

): { mapped: BankParsedRow[]; pending: BankParsedRow[] } {

  const mapped: BankParsedRow[] = []

  const pending: BankParsedRow[] = []

  for (const row of rows) {

    const cat = resolveBankMappingCategoryName(maps ?? {}, row)

    if (cat?.trim()) mapped.push(row)

    else pending.push(row)

  }

  return { mapped, pending }

}



function rowsForAccount(rows: BankParsedRow[], accountId: string): BankParsedRow[] {

  return rows.filter((r) => r.externalBankAccountId === accountId)

}



function buildPerAccountImportStats(

  syncPerAccount: SyncPerAccountMeta[],

  allFetchedRows: BankParsedRow[],

  newRows: BankParsedRow[],

  mapped: BankParsedRow[],

  pending: BankParsedRow[],

): BankAutoImportAccountResult[] {

  const dupByAccount = new Map<string, number>()

  for (const row of allFetchedRows) {

    const accId = row.externalBankAccountId

    if (!accId) continue

    const inNew = newRows.some(

      (n) =>

        n.externalBankTxId === row.externalBankTxId &&

        n.externalBankAccountId === row.externalBankAccountId,

    )

    if (!inNew) {

      dupByAccount.set(accId, (dupByAccount.get(accId) ?? 0) + 1)

    }

  }



  return syncPerAccount.map((p) => {

    const accMapped = rowsForAccount(mapped, p.accountId)

    const accPending = rowsForAccount(pending, p.accountId)

    const fetched = rowsForAccount(allFetchedRows, p.accountId).length

    return {

      accountId: p.accountId,

      label: p.label,

      fetched,

      imported: accMapped.length,

      pending: accPending.length,

      duplicate: dupByAccount.get(p.accountId) ?? 0,

      error: p.error,

    }

  })

}



function runDisplayName(

  bankDisplayName: string,

  trigger: BankAutoImportTrigger,

  accountCount: number,

): string {

  const prefix = trigger === 'cron' ? 'Automatisk' : 'Manuell'

  const suffix =

    accountCount > 1 ? `${bankDisplayName}, ${accountCount} kontoer` : bankDisplayName

  return `${prefix} (${suffix})`

}



export async function runBankAutoImportForConnection(

  admin: SupabaseClient,

  connection: BankConnectionRow,

  trigger: BankAutoImportTrigger,

  req: NextRequest | null,

): Promise<BankAutoImportResult> {

  const startedAt = new Date().toISOString()

  const finishedAt = () => new Date().toISOString()

  const { user_id: userId, profile_id: profileId, bank_id: bankId } = connection



  try {

    const syncResult = await runNeonomicsSync(admin, userId, profileId, req, {

      bankId,

      psuIp: req ? undefined : '127.0.0.1',

    })



    if (syncResult.needsConsent) {

      await recordBankSyncResult(admin, connection.id, {

        ok: false,

        error: 'Samtykke må fornyes i banken.',

      })

      await insertBankSyncLog(admin, {

        connection_id: connection.id,

        user_id: userId,

        profile_id: profileId,

        bank_id: bankId,

        trigger,

        started_at: startedAt,

        finished_at: finishedAt(),

        error: 'needs_consent',

      }).catch(() => {})

      return {

        ok: false,

        needsConsent: true,

        bankAuthUrl: syncResult.bankAuthUrl,

        consentUrl: syncResult.consentUrl,

      }

    }



    const { data: stateRow, error: loadErr } = await admin

      .from('user_app_state')

      .select('state')

      .eq('user_id', userId)

      .maybeSingle()



    if (loadErr) throw new Error(loadErr.message)



    const slice = (stateRow?.state ?? null) as PersistedAppSlice | null

    if (!slice?.people) {

      throw new Error('Fant ikke app-tilstand for bruker.')

    }



    const person = slice.people[profileId]

    if (!person) {

      throw new Error('Fant ikke profil i app-tilstand.')

    }



    const existingTxs = person.transactions ?? []

    const { rows: newRows, duplicateCount } = filterNeonomicsRowsNotYetImported(

      syncResult.rows,

      existingTxs,

      profileId,

    )



    const sourceId = bankSourceIdForNeonomicsBank(bankId)

    const maps = slice.bankImportMappings?.[sourceId]

    const { mapped, pending } = splitRowsByMapping(newRows, maps)



    const accountResults = buildPerAccountImportStats(

      syncResult.meta.perAccount,

      syncResult.rows,

      newRows,

      mapped,

      pending,

    )



    let nextSlice: PersistedAppSlice = { ...slice }

    let importedCount = 0

    let skippedUnmapped = 0



    const accountCount = syncResult.meta.perAccount.filter((p) => !p.error).length



    if (mapped.length > 0) {

      const merged = getPickerCategoriesForPerson(person)

      const runId = generateId()

      const getCategoryName = (row: BankParsedRow) =>

        resolveBankMappingCategoryName(maps ?? {}, row)



      const built = buildTransactionsFromBankRows(

        mapped,

        getCategoryName,

        merged,

        profileId,

        runId,

      )

      importedCount = built.transactions.length

      skippedUnmapped =

        built.skippedUnmapped + built.skippedUnknownCategory + built.skippedTypeMismatch



      const run: BankImportRun = {

        id: runId,

        createdAt: new Date().toISOString(),

        sourceId,

        profileId,

        csvProfileId: NEONOMICS_IMPORT_PROFILE_ID,

        fileName: null,

        displayName: runDisplayName(connection.bank_display_name, trigger, accountCount),

        rowCountParsed: syncResult.meta.fetchedCount,

        rowCountImported: importedCount,

        rowCountSkipped: skippedUnmapped + pending.length,

        errorSummary: null,

        importedLines: built.importedLineSnapshots,

        accountSummaries: accountResults.map((a) => ({

          accountId: a.accountId,

          label: a.label,

          imported: a.imported,

          pending: a.pending,

        })),

      }



      nextSlice = applyBankImportToPersistedSlice(nextSlice, run, built.transactions)

    }



    const pendingKey = bankPendingNeonomicsKey(profileId, bankId)

    const pendingPayload: BankPendingNeonomicsPayload | null =

      pending.length > 0

        ? {

            profileId,

            bankId,

            bankDisplayName: connection.bank_display_name,

            rows: pending,

            label: `Neonomics (${connection.bank_display_name})`,

            updatedAt: new Date().toISOString(),

            fetchedCount: syncResult.meta.fetchedCount,

            duplicateCount,

          }

        : null



    const nextPending = { ...(nextSlice.bankPendingNeonomics ?? {}) }

    if (pendingPayload) nextPending[pendingKey] = pendingPayload

    else delete nextPending[pendingKey]



    nextSlice = { ...nextSlice, bankPendingNeonomics: nextPending }



    const { error: upErr } = await admin

      .from('user_app_state')

      .update({

        state: nextSlice as unknown as Record<string, unknown>,

        updated_at: new Date().toISOString(),

      })

      .eq('user_id', userId)



    if (upErr) throw new Error(upErr.message)



    const syncedAt = finishedAt()

    const prevCache = parseAccountsCache(connection.accounts_cache)

    const mergedCache = mergeAccountsCache(prevCache, syncResult.accounts)

    const perAccountForCache: SyncPerAccountMeta[] = accountResults.map((a) => ({

      accountId: a.accountId,

      label: a.label,

      fetchedCount: a.fetched,

      importedCount: a.imported,

      pendingCount: a.pending,

      duplicateCount: a.duplicate,

      error: a.error,

    }))

    const nextCache = applyPerAccountStatsToCache(mergedCache, perAccountForCache, syncedAt)



    await recordBankSyncResult(admin, connection.id, {

      ok: true,

      fetchedCount: syncResult.meta.fetchedCount,

    })

    await updateBankConnection(admin, connection.id, {

      pending_unmapped_count: pending.length,

      accounts_cache: nextCache,

    })



    for (const acc of accountResults) {

      await insertBankSyncLog(admin, {

        connection_id: connection.id,

        user_id: userId,

        profile_id: profileId,

        bank_id: bankId,

        trigger,

        started_at: startedAt,

        finished_at: syncedAt,

        account_id: acc.accountId,

        fetched_count: acc.fetched,

        imported_count: acc.imported,

        skipped_unmapped: acc.pending,

        duplicate_count: acc.duplicate,

        error: acc.error?.slice(0, 500) ?? null,

      }).catch(() => {})

    }



    return {

      ok: true,

      needsConsent: false,

      fetchedCount: syncResult.meta.fetchedCount,

      importedCount,

      pendingCount: pending.length,

      duplicateCount,

      skippedUnmapped,

      accounts: accountResults,

    }

  } catch (e) {

    const msg = e instanceof Error ? e.message : 'Ukjent feil ved bankimport.'

    await recordBankSyncResult(admin, connection.id, { ok: false, error: msg }).catch(() => {})

    await insertBankSyncLog(admin, {

      connection_id: connection.id,

      user_id: userId,

      profile_id: profileId,

      bank_id: bankId,

      trigger,

      started_at: startedAt,

      finished_at: finishedAt(),

      error: msg.slice(0, 500),

    }).catch(() => {})

    return { ok: false, needsConsent: false, error: msg }

  }

}



/** Oppdater pending-telling per konto i cache etter manuell kartlegging (valgfritt). */

export function pendingCountsFromRows(rows: BankParsedRow[]): Map<string, number> {

  return countPendingByAccountId(rows)

}


