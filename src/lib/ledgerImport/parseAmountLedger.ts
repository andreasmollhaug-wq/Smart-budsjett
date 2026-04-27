import {
  normalizeNorwegianAmountToPlainDecimalString,
  roundMoney2,
} from '@/lib/money/parseNorwegianAmount'

/**
 * Tolker én CSV-celle til beløp (hele kroner eller inntil 2 desimaler).
 * For regnskap: debet/kredit er som regel ikke-negative; signed kolonner kan være negative.
 */
export function parseLedgerAmountCell(
  raw: string,
  opts?: { allowNegative?: boolean; precision?: 'integer' | 'ore' },
): number | null {
  const allowNegative = opts?.allowNegative === true
  const precision = opts?.precision ?? 'integer'
  let s = raw.trim()
  let neg = false
  if (allowNegative && s.startsWith('-')) {
    neg = true
    s = s.slice(1).trim()
  }
  const plain = normalizeNorwegianAmountToPlainDecimalString(s, { allowTrailingComma: false })
  if (plain == null) return null
  const parsed = Number(plain)
  if (!Number.isFinite(parsed)) return null
  let n = precision === 'ore' ? roundMoney2(parsed) : Math.round(parsed)
  if (neg) n = -n
  return n
}
