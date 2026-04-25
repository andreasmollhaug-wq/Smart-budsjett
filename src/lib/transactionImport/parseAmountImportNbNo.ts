import { normalizeNorwegianAmountToPlainDecimalString } from '@/lib/money/parseNorwegianAmount'

/**
 * Tolker beløp fra CSV-import (norsk/Excel).
 *
 * Håndterer vanlige norske tallformater:
 *   - Heltall: «1050», «13 000»
 *   - Desimal med komma: «1050,66», «1 050,66», «1.050,66»
 *   - Tusenskille med mellomrom, NBSP, tynn mellomrom eller punktum
 *
 * Returnerer avrundet positivt heltall (kroner), eller NaN ved ugyldig/tomt/ikke-positivt.
 */
export function parseAmountImportNbNo(raw: string): number {
  const plain = normalizeNorwegianAmountToPlainDecimalString(raw, { allowTrailingComma: false })
  if (plain == null) return NaN
  const n = Math.round(Number(plain))
  if (!Number.isFinite(n) || n <= 0) return NaN
  return n
}
