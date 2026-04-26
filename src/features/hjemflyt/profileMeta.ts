import { validateChildEmojiAgainstPalette } from './emojiPalette'
import type { HjemflytProfileKind, HjemflytProfileMeta } from './types'

/** Må samsvare med `DEFAULT_PROFILE_ID` i store — hovedprofil kan aldri være «barn» i HjemFlyt. */
const PRIMARY_ID = 'default' as const

export function normalizeHjemflytProfileMeta(
  profileId: string,
  raw: HjemflytProfileMeta | undefined,
): HjemflytProfileMeta | undefined {
  if (profileId === PRIMARY_ID) {
    return { kind: 'adult' }
  }
  if (!raw || typeof raw !== 'object') return undefined
  const k = (raw as { kind?: string }).kind
  const kind: HjemflytProfileKind = k === 'child' ? 'child' : 'adult'
  if (kind === 'adult') {
    return { kind: 'adult' }
  }
  const emoji = validateChildEmojiAgainstPalette((raw as { childEmoji?: string }).childEmoji)
  return emoji ? { kind: 'child', childEmoji: emoji } : { kind: 'child' }
}
