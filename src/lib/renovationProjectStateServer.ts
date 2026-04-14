import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createEmptyRenovationModuleState,
  normalizeRenovationModuleState,
  type RenovationModulePersistedState,
} from '@/features/renovation-project/types'

export async function getRenovationModuleStateForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<RenovationModulePersistedState> {
  try {
    const { data, error } = await supabase
      .from('user_renovation_project_state')
      .select('state')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[user_renovation_project_state] select:', error.message)
      return createEmptyRenovationModuleState()
    }

    if (data?.state != null && typeof data.state === 'object') {
      return normalizeRenovationModuleState(data.state)
    }

    return createEmptyRenovationModuleState()
  } catch (e) {
    console.error('[user_renovation_project_state]', e)
    return createEmptyRenovationModuleState()
  }
}
