/** Parser «Hurtigsvar: … | …» fra AI-svar — kun eksplisitt linje, ingen gjetting. */

const QUICK_REPLY_LINE_RE = /\nHurtigsvar:\s*(.+)$/i
const QUICK_REPLY_ONLY_RE = /^Hurtigsvar:\s*(.+)$/i

function splitQuickReplyOptions(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 80)
    .slice(0, 4)
}

/** Fjerner Hurtigsvar-linjen fra visning og returnerer knappetekster. */
export function parseAiReplyQuickReplies(content: string): { body: string; quickReplies: string[] } {
  const trimmed = content.trimEnd()
  if (!trimmed) return { body: content, quickReplies: [] }

  const trailingMatch = trimmed.match(QUICK_REPLY_LINE_RE)
  if (trailingMatch) {
    const quickReplies = splitQuickReplyOptions(trailingMatch[1])
    if (quickReplies.length > 0) {
      return { body: trimmed.slice(0, trailingMatch.index).trimEnd(), quickReplies }
    }
  }

  const onlyMatch = trimmed.match(QUICK_REPLY_ONLY_RE)
  if (onlyMatch) {
    const quickReplies = splitQuickReplyOptions(onlyMatch[1])
    if (quickReplies.length > 0) {
      return { body: '', quickReplies }
    }
  }

  return { body: content, quickReplies: [] }
}

export function resolveAiReplyQuickReplies(content: string): {
  body: string
  quickReplies: string[]
} {
  return parseAiReplyQuickReplies(content)
}
