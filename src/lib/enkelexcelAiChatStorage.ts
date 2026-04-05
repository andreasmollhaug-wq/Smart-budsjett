import { generateId } from '@/lib/utils'

const STORAGE_VERSION = 'v1'

export type StoredChatRole = 'user' | 'assistant'

export type StoredChatMessage = {
  id: string
  role: StoredChatRole
  content: string
}

export const MAX_STORED_AI_MESSAGES = 120

export function enkelexcelAiChatStorageKey(userId: string): string {
  return `smart-budsjett-enkelexcel-ai-chat-${STORAGE_VERSION}:${userId}`
}

export function trimStoredMessages(msgs: StoredChatMessage[]): StoredChatMessage[] {
  if (msgs.length <= MAX_STORED_AI_MESSAGES) return msgs
  return msgs.slice(-MAX_STORED_AI_MESSAGES)
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
      out.push({ id, role: m.role, content: m.content })
    }
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}
