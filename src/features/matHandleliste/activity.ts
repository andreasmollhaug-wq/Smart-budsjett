import { generateId } from '@/lib/utils'
import { MAT_HANDLELISTE_ACTIVITY_MAX, type MatActivityEvent, type MatActivityType, type MatHandlelisteState } from './types'

export function pushMatActivity(
  state: MatHandlelisteState,
  profileId: string,
  type: MatActivityType,
  message: string,
): MatHandlelisteState {
  const ev: MatActivityEvent = {
    id: generateId(),
    at: new Date().toISOString(),
    profileId,
    type,
    message: message.slice(0, 300),
  }
  return {
    ...state,
    activity: [...state.activity, ev].slice(-MAT_HANDLELISTE_ACTIVITY_MAX),
  }
}
