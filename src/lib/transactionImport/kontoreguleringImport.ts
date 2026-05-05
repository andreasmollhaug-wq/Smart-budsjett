/**
 * Gjenkjenner bank/posteringstekst typisk merket «Kontoregulering» (egenkonto-overføringer).
 * Sammenligning er case- og mellomrom-nøytral for enkle varianter.
 */
export function importTextContainsKontoregulering(raw: string | undefined | null): boolean {
  if (raw == null) return false
  const t = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (t.includes('kontoregulering')) return true
  return /\bkonto\s+regulering\b/.test(t)
}
