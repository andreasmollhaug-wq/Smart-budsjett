import {
  enkelexcelAiChatStorageKey,
  parseStoredAiChatMessages,
} from '@/lib/enkelexcelAiChatStorage'

/** Stabil id — lagres i deliveredAnnouncementIds så invitasjonen ikke gjentas. */
export const DOTTIR_AI_ENGAGEMENT_NOTIFICATION_ID = 'dottir-ai-engagement-10m'

/** Akkumulert synlig tid i appen før varsel (10 min). */
export const DOTTIR_AI_ENGAGEMENT_VISIBLE_MS = 10 * 60 * 1000

/** Intern href — NotificationBell åpner modal i stedet for navigasjon. */
export const DOTTIR_AI_OPEN_ACTION_HREF = '__dottir_ai_open__'

export const DOTTIR_AI_EVER_OPENED_KEY = 'dottir-ai-ever-opened-v1'

export function markDottirAiOpened(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DOTTIR_AI_EVER_OPENED_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** True når brukeren allerede har åpnet chatten eller sendt minst én melding. */
export function hasUserUsedDottirAi(userId: string | null): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem(DOTTIR_AI_EVER_OPENED_KEY) === '1') return true
  } catch {
    /* ignore */
  }
  if (!userId) return false
  try {
    const raw = window.localStorage.getItem(enkelexcelAiChatStorageKey(userId))
    const parsed = parseStoredAiChatMessages(raw)
    if (parsed?.some((m) => m.role === 'user')) return true
  } catch {
    /* ignore */
  }
  return false
}

export function dottirAiEngagementNotificationTitle(): string {
  return 'Har du prøvd dottir AI?'
}

export function dottirAiEngagementNotificationBody(): string {
  return `Assistenten svarer ut fra tallene dine og kan forklare appen — uten at du må lete i menyer.

Du kan blant annet spørre om:
• Oppsummering av utgifter og avvik mot budsjett
• Sparing, gjeld og abonnementer
• Hvor du finner en funksjon i Dottir

Trykk «Åpne dottir AI» for å starte.`
}
