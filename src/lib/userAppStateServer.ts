import type { SupabaseClient } from '@supabase/supabase-js'
import { createDefaultPersistedSlice } from '@/lib/store'

export async function getOrCreateUserAppState(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ state: unknown; wasCreated: boolean }> {
  const defaultSlice = createDefaultPersistedSlice()

  try {
    const { data, error } = await supabase
      .from('user_app_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[user_app_state] select:', error.message)
      return { state: defaultSlice, wasCreated: false }
    }

    if (data?.state != null && typeof data.state === 'object') {
      return { state: data.state, wasCreated: false }
    }

    const { error: insertError } = await supabase.from('user_app_state').insert({
      user_id: userId,
      state: defaultSlice,
    })

    if (!insertError) {
      return { state: defaultSlice, wasCreated: true }
    }

    console.error('[user_app_state] insert:', insertError.message)

    // Unik nøkkel: rad opprettet av annen forespørsel (race) — hent på nytt
    if (insertError.code === '23505') {
      const { data: retry } = await supabase
        .from('user_app_state')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle()
      if (retry?.state != null && typeof retry.state === 'object') {
        return { state: retry.state, wasCreated: false }
      }
    }

    return { state: defaultSlice, wasCreated: false }
  } catch (e) {
    console.error('[user_app_state]', e)
    return { state: defaultSlice, wasCreated: false }
  }
}
