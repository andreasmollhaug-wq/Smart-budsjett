import { generateId } from '@/lib/utils'
import type {
  ActionStatus,
  AppliedActionSummary,
} from '@/lib/dottirAiActions/types'
import type { ValidatedAction } from '@/lib/dottirAiActions/validate'

const STORAGE_VERSION = 'v2'

export type StoredChatRole = 'user' | 'assistant'

export type StoredChatMessage = {
  id: string
  role: StoredChatRole
  content: string
  proposedAction?: ValidatedAction | null
  actionStatus?: ActionStatus
  appliedSummary?: AppliedActionSummary | null
}

export const MAX_STORED_AI_MESSAGES = 120

export function enkelexcelAiChatStorageKey(userId: string): string {
  return `smart-budsjett-enkelexcel-ai-chat-${STORAGE_VERSION}:${userId}`
}

export function trimStoredMessages(msgs: StoredChatMessage[]): StoredChatMessage[] {
  if (msgs.length <= MAX_STORED_AI_MESSAGES) return msgs
  return msgs.slice(-MAX_STORED_AI_MESSAGES)
}

function isValidActionStatus(v: unknown): v is ActionStatus {
  return v === 'pending' || v === 'confirmed' || v === 'cancelled' || v === 'edited'
}

export function parseStoredAiChatMessages(raw: string | null): StoredChatMessage[] | null {
  if (raw == null || raw === '') return null
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return null
    const out: StoredChatMessage[] = []
    for (const item of data) {
      if (!item || typeof item !== 'object') continue
      const m = item as Record<string, unknown>
      if (m.role !== 'user' && m.role !== 'assistant') continue
      if (typeof m.content !== 'string') continue
      const id = typeof m.id === 'string' && m.id.length > 0 ? m.id : generateId()
      const msg: StoredChatMessage = { id, role: m.role, content: m.content }
      if (m.proposedAction != null && typeof m.proposedAction === 'object') {
        msg.proposedAction = m.proposedAction as ValidatedAction
      }
      if (isValidActionStatus(m.actionStatus)) msg.actionStatus = m.actionStatus
      if (m.appliedSummary != null && typeof m.appliedSummary === 'object') {
        msg.appliedSummary = m.appliedSummary as AppliedActionSummary
      }
      out.push(msg)
    }
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

export function serializeStoredAiChatMessages(msgs: StoredChatMessage[]): string {
  return JSON.stringify(msgs)
}
