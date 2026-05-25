import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireNeonomicsApiAuth, isAuthedContext } from '@/lib/neonomics/apiRouteGuard'
import {
  accountsToCacheSnapshot,
  mergeAccountsCache,
} from '@/lib/neonomics/accountTypes'
import { fetchNeonomicsAccounts } from '@/lib/neonomics/accounts'
import { getBankConnection, updateBankConnection } from '@/lib/neonomics/bankConnectionsRepo'
import { resolveNeonomicsBankId } from '@/lib/neonomics/bankCatalog'
import { buildNeonomicsContext } from '@/lib/neonomics/requestContext'
import { encryptSandboxPsuId } from '@/lib/neonomics/psu'
import { parseAccountsCache, syncAccountIdsFromConnection } from '@/lib/neonomics/syncAccounts'
import { NeonomicsApiError } from '@/lib/neonomics/errors'

export const dynamic = 'force-dynamic'

/** Oppdater kontoliste fra Neonomics uten full transaksjonssync. */
export async function GET(req: NextRequest) {
  const auth = await requireNeonomicsApiAuth()
  if (!isAuthedContext(auth)) return auth

  const url = new URL(req.url)
  const profileId = url.searchParams.get('profileId')?.trim()
  const bankIdParam = url.searchParams.get('bankId')?.trim()

  if (!profileId) {
    return NextResponse.json({ error: 'profileId er påkrevd.' }, { status: 400 })
  }

  const bank = resolveNeonomicsBankId(bankIdParam)
  const conn = await getBankConnection(auth.supabase, auth.userId, profileId, bank.bankId)
  if (!conn) {
    return NextResponse.json({ error: 'Ingen bankkobling. Koble bank først.' }, { status: 404 })
  }

  const ctx = {
    deviceId: conn.device_id,
    sessionId: conn.session_id,
    psuIp: buildNeonomicsContext(auth.userId, profileId, req).psuIp,
    psuId: encryptSandboxPsuId(),
  }

  try {
    const accounts = await fetchNeonomicsAccounts(ctx)
    const prevCache = parseAccountsCache(conn.accounts_cache)
    const merged = mergeAccountsCache(prevCache, accounts)
    const accountIds = accounts.map((a) => a.id).filter(Boolean)
    let syncIds = syncAccountIdsFromConnection(conn)
    if (syncIds.length === 0) {
      syncIds = accountIds
    } else {
      syncIds = syncIds.filter((id) => accountIds.includes(id))
      if (syncIds.length === 0) syncIds = accountIds
    }

    await updateBankConnection(auth.supabase, conn.id, {
      accounts_cache: merged.length > 0 ? merged : accountsToCacheSnapshot(accounts),
      sync_account_ids: syncIds,
      selected_account_id: syncIds[0] ?? null,
    })

    return NextResponse.json({
      accounts: merged.map((a) => ({
        id: a.id,
        iban: a.iban,
        displayName: a.displayName ?? a.accountName,
        lastSyncAt: a.lastSyncAt,
        lastFetchedCount: a.lastFetchedCount,
        lastImportedCount: a.lastImportedCount,
        lastPendingCount: a.lastPendingCount,
      })),
      syncAccountIds: syncIds,
    })
  } catch (e) {
    if (e instanceof NeonomicsApiError) {
      return NextResponse.json(
        { error: e.message, errorCode: e.errorCode },
        { status: e.statusCode >= 400 ? e.statusCode : 510 },
      )
    }
    const msg = e instanceof Error ? e.message : 'Kunne ikke hente kontoer.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

