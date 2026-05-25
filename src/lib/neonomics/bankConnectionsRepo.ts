import type { SupabaseClient } from '@supabase/supabase-js'

export type BankConnectionRow = {
  id: string
  user_id: string
  profile_id: string
  provider: string
  bank_id: string
  bank_display_name: string
  session_id: string
  device_id: string
  selected_account_id: string | null
  sync_account_ids: string[]
  accounts_cache: unknown
  consent_ok_at: string | null
  last_sync_at: string | null
  last_sync_fetched_count: number | null
  last_sync_error: string | null
  auto_sync_enabled: boolean
  pending_unmapped_count: number
  created_at: string
  updated_at: string
}

const PROVIDER_NEONOMICS = 'neonomics'

export async function getBankConnection(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
  bankId: string,
): Promise<BankConnectionRow | null> {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('bank_id', bankId)
    .eq('provider', PROVIDER_NEONOMICS)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as BankConnectionRow | null
}

export async function getBankConnectionById(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string,
): Promise<BankConnectionRow | null> {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as BankConnectionRow | null
}

export async function listBankConnections(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
): Promise<BankConnectionRow[]> {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('provider', PROVIDER_NEONOMICS)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as BankConnectionRow[]
}

export async function listAutoSyncBankConnections(
  supabase: SupabaseClient,
): Promise<BankConnectionRow[]> {
  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('provider', PROVIDER_NEONOMICS)
    .eq('auto_sync_enabled', true)
    .not('consent_ok_at', 'is', null)
  if (error) throw new Error(error.message)
  return (data ?? []) as BankConnectionRow[]
}

export async function upsertBankConnection(
  supabase: SupabaseClient,
  row: {
    user_id: string
    profile_id: string
    bank_id: string
    bank_display_name: string
    session_id: string
    device_id: string
    selected_account_id?: string | null
    sync_account_ids?: string[]
    accounts_cache?: unknown
    consent_ok_at?: string | null
  },
): Promise<BankConnectionRow> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('bank_connections')
    .upsert(
      {
        ...row,
        provider: PROVIDER_NEONOMICS,
        updated_at: now,
      },
      { onConflict: 'user_id,profile_id,bank_id' },
    )
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as BankConnectionRow
}

export async function updateBankConnection(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<
      BankConnectionRow,
      | 'session_id'
      | 'selected_account_id'
      | 'sync_account_ids'
      | 'accounts_cache'
      | 'consent_ok_at'
      | 'last_sync_at'
      | 'last_sync_fetched_count'
      | 'last_sync_error'
      | 'auto_sync_enabled'
      | 'pending_unmapped_count'
      | 'updated_at'
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from('bank_connections')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export type RecordBankSyncResultInput =
  | { ok: true; fetchedCount: number }
  | { ok: false; error: string }

/** Oppdater last_sync_* etter manuell/cron sync. */
export async function recordBankSyncResult(
  supabase: SupabaseClient,
  connectionId: string,
  result: RecordBankSyncResultInput,
): Promise<void> {
  const now = new Date().toISOString()
  if (result.ok) {
    await updateBankConnection(supabase, connectionId, {
      last_sync_at: now,
      last_sync_fetched_count: result.fetchedCount,
      last_sync_error: null,
    })
    return
  }
  const err = result.error.trim().slice(0, 500)
  await updateBankConnection(supabase, connectionId, {
    last_sync_error: err || 'Ukjent feil ved henting.',
  })
}

export async function insertBankSyncLog(
  supabase: SupabaseClient,
  row: {
    connection_id: string
    user_id: string
    profile_id: string
    bank_id: string
    trigger: 'cron' | 'manual'
    started_at: string
    finished_at?: string | null
    fetched_count?: number | null
    imported_count?: number | null
    skipped_unmapped?: number | null
    duplicate_count?: number | null
    account_id?: string | null
    error?: string | null
  },
): Promise<void> {
  const { error } = await supabase.from('bank_sync_log').insert(row)
  if (error) throw new Error(error.message)
}

export async function deleteBankConnection(
  supabase: SupabaseClient,
  userId: string,
  profileId: string,
  bankId: string,
): Promise<void> {
  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('bank_id', bankId)
    .eq('provider', PROVIDER_NEONOMICS)
  if (error) throw new Error(error.message)
}

export async function deleteBankConnectionById(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}
