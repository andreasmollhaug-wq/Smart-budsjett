/**
 * Normaliserer forklaringstekst for mapping-nøkkel: trim, kollapse whitespace, NFC.
 * Ikke lowercase — bevar butikk- og leverandør-staving.
 */
export function normalizeMappingKeyText(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFC')
}
