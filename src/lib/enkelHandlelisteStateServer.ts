import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeEnkelHandlelisteState } from '@/features/enkelHandleliste/normalize'
import {
  createEmptyEnkelHandlelisteState,
  type EnkelHandlelisteState,
} from '@/features/enkelHandleliste/types'

export async function getEnkelHandlelisteStateForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<EnkelHandlelisteState> {
  try {
    const { data, error } = await supabase
      .from('user_enkel_handleliste_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[user_enkel_handleliste_state] select:', error.message)
      return createEmptyEnkelHandlelisteState()
    }

    if (data?.state != null && typeof data.state === 'object') {
      return normalizeEnkelHandlelisteState(data.state)
    }

    return createEmptyEnkelHandlelisteState()
  } catch (e) {
    console.error('[user_enkel_handleliste_state]', e)
    return createEmptyEnkelHandlelisteState()
  }
}
