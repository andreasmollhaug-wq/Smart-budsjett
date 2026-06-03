import type { SupabaseClient } from '@supabase/supabase-js'
import {
  hasVerifiedTotpFactor,
  needsMfaStepUp,
} from '@/lib/auth/mfa'
import { authPrimaryEmail } from '@/lib/stripe/extendedTrial'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import type { AdminAccessResult } from '@/lib/admin/types'

export function normalizeAdminViewerEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function isEmailAdminViewer(
  email: string,
  admin: SupabaseClient,
): Promise<boolean> {
  const normalized = normalizeAdminViewerEmail(email)
  if (!normalized) return false
  const { data, error } = await admin
    .from('admin_viewer')
    .select('email')
    .eq('email', normalized)
    .maybeSingle()
  if (error) {
    console.error('[admin] admin_viewer lookup', error)
    return false
  }
  return data !== null
}

export async function requireAdminViewerAccess(
  supabase: SupabaseClient,
): Promise<AdminAccessResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthenticated' }

  const email = authPrimaryEmail(user)
  if (!email) return { ok: false, reason: 'no_email' }

  const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
  if (factorsErr) {
    console.error('[admin] mfa.listFactors', factorsErr)
    return { ok: false, reason: 'config' }
  }
  if (!hasVerifiedTotpFactor(factors)) {
    return { ok: false, reason: 'mfa_not_enrolled' }
  }

  const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalErr) {
    console.error('[admin] mfa.getAuthenticatorAssuranceLevel', aalErr)
    return { ok: false, reason: 'config' }
  }
  if (needsMfaStepUp(aalData)) {
    return { ok: false, reason: 'mfa_step_up_required' }
  }

  const serviceAdmin = createServiceRoleClient()
  if (!serviceAdmin) return { ok: false, reason: 'config' }

  const allowed = await isEmailAdminViewer(email, serviceAdmin)
  if (!allowed) return { ok: false, reason: 'not_allowlisted' }

  return { ok: true, email }
}
