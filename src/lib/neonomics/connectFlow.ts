import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchNeonomicsAccounts, type NeonomicsAccount } from '@/lib/neonomics/accounts'
import { resolveNeonomicsBankId } from '@/lib/neonomics/bankCatalog'
import { fetchConsentBankUrl, consentHrefFromErrorBody } from '@/lib/neonomics/consent'
import { NeonomicsApiError } from '@/lib/neonomics/errors'
import { createNeonomicsSession } from '@/lib/neonomics/session'
import { accountsToCacheSnapshot } from '@/lib/neonomics/accountTypes'
import { upsertBankConnection, updateBankConnection, getBankConnection } from '@/lib/neonomics/bankConnectionsRepo'
import { buildNeonomicsContext } from '@/lib/neonomics/requestContext'
import { encryptSandboxPsuId } from '@/lib/neonomics/psu'
import type { NextRequest } from 'next/server'
import { getSiteUrl } from '@/lib/site-url'

export type ConnectResult =
  | { needsConsent: true; consentUrl: string; bankAuthUrl?: string; bankId: string }
  | { needsConsent: false; accounts: NeonomicsAccount[]; bankId: string }

function callbackUrl(profileId: string, bankId: string): string {
  return `${getSiteUrl()}/api/bank/neonomics/callback?profileId=${encodeURIComponent(profileId)}&bankId=${encodeURIComponent(bankId)}`
}

export async function runNeonomicsConnect(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
  req: NextRequest,
  bankIdInput?: string,
): Promise<ConnectResult> {
  const bank = resolveNeonomicsBankId(bankIdInput)
  const ctx = buildNeonomicsContext(userId, profileId, req)
  const { sessionId } = await createNeonomicsSession(ctx, bank.bankId)

  await upsertBankConnection(supabase, {
    user_id: userId,
    profile_id: profileId,
    bank_id: bank.bankId,
    bank_display_name: bank.displayName,
    session_id: sessionId,
    device_id: ctx.deviceId,
    consent_ok_at: null,
  })

  const callbackRedirect = callbackUrl(profileId, bank.bankId)
  const sessionCtx = { ...ctx, sessionId }

  try {
    const accounts = await fetchNeonomicsAccounts(sessionCtx)
    const accountIds = accounts.map((a) => a.id).filter(Boolean)
    await upsertBankConnection(supabase, {
      user_id: userId,
      profile_id: profileId,
      bank_id: bank.bankId,
      bank_display_name: bank.displayName,
      session_id: sessionId,
      device_id: ctx.deviceId,
      consent_ok_at: new Date().toISOString(),
      selected_account_id: accountIds[0] ?? null,
      sync_account_ids: accountIds,
      accounts_cache: accountsToCacheSnapshot(accounts),
    })
    return { needsConsent: false, accounts, bankId: bank.bankId }
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
    if (e instanceof NeonomicsApiError && e.errorCode === '1426') {
      const href = consentHrefFromErrorBody(e.body)
      if (href) {
        const bankAuthUrl = await fetchConsentBankUrl(href, ctx, callbackRedirect)
        return { needsConsent: true, consentUrl: href, bankAuthUrl, bankId: bank.bankId }
      }
    }
    throw e
  }
}

/**
 * Etter samtykke i bank-popup: marker consent og hent kontoer til cache (manglet tidligere).
 */
export async function markNeonomicsConsentOk(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
  bankId: string,
  req: NextRequest | null = null,
): Promise<{ accountCount: number }> {
  const conn = await getBankConnection(supabase, userId, profileId, bankId)
  if (!conn) return { accountCount: 0 }

  const psuCtx = buildNeonomicsContext(userId, profileId, req)
  const sessionCtx = {
    deviceId: conn.device_id,
    sessionId: conn.session_id,
    psuIp: psuCtx.psuIp,
    psuId: encryptSandboxPsuId(),
  }

  let accounts: NeonomicsAccount[] = []
  try {
    accounts = await fetchNeonomicsAccounts(sessionCtx)
  } catch {
    accounts = []
  }

  const accountIds = accounts.map((a) => a.id).filter(Boolean)
  await updateBankConnection(supabase, conn.id, {
    consent_ok_at: new Date().toISOString(),
    ...(accountIds.length > 0
      ? {
          selected_account_id: accountIds[0] ?? null,
          sync_account_ids: accountIds,
          accounts_cache: accountsToCacheSnapshot(accounts),
        }
      : {}),
  })

  return { accountCount: accounts.length }
}
