/**
 * Kompakt, trygg palett for barne-emoji (én valgt tegn, ingen fri tekst).
 * Brukes med validateChildEmojiAgainstPalette.
 */
export const HJEMFLYT_CHILD_EMOJI_PALETTE: readonly string[] = [
  '\uD83D\uDC36',
  '\uD83D\uDC31',
  '\uD83D\uDC2D',
  '\uD83D\uDC30',
  '\uD83E\uDDA3',
  '\uD83D\uDC38',
  '\uD83E\uDD9A',
  '\uD83E\uDDA0',
  '\uD83D\uDC0B',
  '\uD83D\uDC1F',
  '\uD83D\uDC20',
  '\uD83D\uDC23',
  '\uD83D\uDC3C',
  '\uD83D\uDC28',
  '\uD83D\uDC32',
  '\uD83E\uDD8A',
  '\uD83D\uDC35',
  '\uD83D\uDC12',
  '\uD83E\uDD7D',
  '\uD83C\uDF34',
  '\uD83C\uDF32',
  '\uD83C\uDF33',
  '\uD83C\uDF42',
  '\uD83C\uDF41',
  '\uD83C\uDF38',
  '\uD83C\uDF37',
  '\uD83C\uDF39',
  '\uD83C\uDF3B',
  '\uD83C\uDF3C',
  '\uD83C\uDF40',
  '\u2B50',
  '\uD83C\uDF1F',
  '\u2728',
  '\uD83C\uDF19',
  '\uD83C\uDF0E',
  '\uD83C\uDF0D',
  '\uD83C\uDF0B',
  '\uD83C\uDFD4\uFE0F',
  '\uD83C\uDFD5\uFE0F',
  '\uD83C\uDFD6\uFE0F',
  '\uD83C\uDFD0',
  '\uD83C\uDFC8',
  '\uD83C\uDFC0',
  '\uD83C\uDFC6',
  '\uD83C\uDF89',
  '\uD83C\uDF88',
  '\uD83C\uDF8A',
  '\uD83C\uDF81',
  '\uD83C\uDF82',
  '\uD83C\uDF6A',
  '\uD83C\uDF6B',
  '\uD83C\uDF4F',
  '\uD83C\uDF4E',
  '\uD83C\uDF47',
  '\uD83C\uDF53',
  '\uD83C\uDF6D',
  '\uD83C\uDF4C',
  '\uD83C\uDF6E',
  '\uD83C\uDF6F',
  '\uD83C\uDEE7',
  '\uD83C\uDEE5',
  '\uD83C\uDEE8',
] as const

export function isEmojiInPalette(emoji: string): boolean {
  if (!emoji) return false
  return HJEMFLYT_CHILD_EMOJI_PALETTE.includes(emoji)
}

export function validateChildEmojiAgainstPalette(emoji: string | undefined | null): string | null {
  if (emoji == null || emoji === '') return null
  const t = emoji.trim()
  if (!t) return null
  return isEmojiInPalette(t) ? t : null
}
