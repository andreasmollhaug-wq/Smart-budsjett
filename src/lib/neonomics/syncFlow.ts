import type { SupabaseClient } from '@supabase/supabase-js'

import type { NextRequest } from 'next/server'

import {

  accountLabelFromNeonomics,

  type SyncPerAccountMeta,

} from '@/lib/neonomics/accountTypes'

import { resolveNeonomicsBankIdAsync } from '@/lib/neonomics/bankCatalog'

import { getBankConnection } from '@/lib/neonomics/bankConnectionsRepo'

import { fetchNeonomicsAccounts, type NeonomicsAccount } from '@/lib/neonomics/accounts'

import { fetchAllNeonomicsTransactions } from '@/lib/neonomics/transactions'

import { fetchConsentBankUrl } from '@/lib/neonomics/consent'

import { NeonomicsApiError } from '@/lib/neonomics/errors'

import { defaultNeonomicsTransactionDateRange } from '@/lib/neonomics/dates'

import { mapNeonomicsTransactionsToSyncRows, type NeonomicsSyncRow } from '@/lib/neonomics/mapToBankParsedRows'

import { buildNeonomicsContext } from '@/lib/neonomics/requestContext'

import { psuIdForBank } from '@/lib/neonomics/psu'

import { resolveAccountsToSync } from '@/lib/neonomics/syncAccounts'

import { getSiteUrl } from '@/lib/site-url'



export type SyncResult =

  | { needsConsent: true; consentUrl: string; bankAuthUrl: string; bankId: string }

  | {

      needsConsent: false

      rows: NeonomicsSyncRow[]

      accounts: NeonomicsAccount[]

      meta: {

        fromDate: string

        toDate: string

        fetchedCount: number

        perAccount: SyncPerAccountMeta[]

        accountErrors: { accountId: string; label: string; error: string }[]

      }

      bankId: string

    }



export async function runNeonomicsSync(

  supabase: SupabaseClient,

  userId: string,

  profileId: string,

  req: NextRequest | null,

  opts?: {

    bankId?: string

    accountId?: string

    fromDate?: string

    toDate?: string

    psuIp?: string

  },

): Promise<SyncResult> {
  const ctxForCatalog = buildNeonomicsContext(userId, profileId, req, { bankId: opts?.bankId })
  const connEarly = opts?.bankId
    ? await getBankConnection(supabase, userId, profileId, opts.bankId.trim())
    : null
  const bank = await resolveNeonomicsBankIdAsync(opts?.bankId, ctxForCatalog, {
    displayName: connEarly?.bank_display_name ?? undefined,
  })
  const conn = connEarly ?? (await getBankConnection(supabase, userId, profileId, bank.bankId))

  if (!conn) {

    throw new Error('Ingen bankkobling. Koble bank først.')

  }



  const psuIp = buildNeonomicsContext(userId, profileId, req, {

    psuIp: opts?.psuIp,

    bankId: bank.bankId,

  }).psuIp

  const psuId = psuIdForBank(bank.bankId)

  const ctx = {

    deviceId: conn.device_id,

    sessionId: conn.session_id,

    psuIp,

    ...(psuId ? { psuId } : {}),

  }



  const range = defaultNeonomicsTransactionDateRange()

  const fromDate = opts?.fromDate ?? range.fromDate

  const toDate = opts?.toDate ?? range.toDate



  const callbackRedirect = `${getSiteUrl()}/api/bank/neonomics/callback?profileId=${encodeURIComponent(profileId)}&bankId=${encodeURIComponent(bank.bankId)}`



  try {

    let accounts: NeonomicsAccount[] = []

    try {

      accounts = await fetchNeonomicsAccounts(ctx)

    } catch {

      accounts = []

    }



    let accountsToSync = resolveAccountsToSync(conn, accounts)

    if (opts?.accountId?.trim()) {

      const single = opts.accountId.trim()

      accountsToSync = accountsToSync.filter((a) => a.id === single)

      if (accountsToSync.length === 0 && accounts.some((a) => a.id === single)) {

        accountsToSync = accounts.filter((a) => a.id === single)

      }

    }



    if (accountsToSync.length === 0) {

      throw new Error('Ingen konto valgt. Velg minst én konto under bankkobling.')

    }



    const allRows: NeonomicsSyncRow[] = []

    const perAccount: SyncPerAccountMeta[] = []

    const accountErrors: { accountId: string; label: string; error: string }[] = []

    let fileLine = 0



    for (const account of accountsToSync) {

      const label = accountLabelFromNeonomics(account)

      try {

        const transactions = await fetchAllNeonomicsTransactions(ctx, {

          accountId: account.id,

          fromDate,

          toDate,

          pageSize: 50,

        })

        const rows = mapNeonomicsTransactionsToSyncRows(transactions, {

          accountId: account.id,

          accountLabel: label,

          fileLineStart: fileLine,

        })

        fileLine += rows.length

        allRows.push(...rows)

        perAccount.push({

          accountId: account.id,

          label,

          fetchedCount: rows.length,

        })

      } catch (e) {

        const msg =

          e instanceof Error ? e.message : 'Kunne ikke hente transaksjoner for konto.'

        accountErrors.push({ accountId: account.id, label, error: msg })

        perAccount.push({

          accountId: account.id,

          label,

          fetchedCount: 0,

          error: msg,

        })

      }

    }



    if (allRows.length === 0 && accountErrors.length === accountsToSync.length) {

      throw new Error(accountErrors[0]?.error ?? 'Kunne ikke hente transaksjoner.')

    }



    return {

      needsConsent: false,

      rows: allRows,

      accounts,

      meta: {

        fromDate,

        toDate,

        fetchedCount: allRows.length,

        perAccount,

        accountErrors,

      },

      bankId: bank.bankId,

    }

  } catch (e) {

    if (e instanceof NeonomicsApiError && e.needsConsent && e.consentHref) {

      const bankAuthUrl = await fetchConsentBankUrl(e.consentHref, ctx, callbackRedirect)

      return {

        needsConsent: true,

        consentUrl: e.consentHref,

        bankAuthUrl,

        bankId: bank.bankId,

      }

    }

    throw e

  }

}


