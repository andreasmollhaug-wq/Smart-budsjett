/**
 * Delte nb-NO-regler for pengebeløp (mellomrom/NBSP/tynt mellomrom som tusen,
 * komma som desimal, punktum som tusen sammen med desimal, kr/NOK/,- bort).
 */

export type NormalizeNorwegianAmountOptions = {
  /**
   * Når sann: tolk ufullstendig «trailing ,» (f.eks. under skriving) som «,0».
   * Må være av for import slik at strengen tilsvarer nøyaktig gammel oppførsel.
   */
  allowTrailingComma?: boolean
}

/** Avrund til to desimaler (øre) – bruk samme sted for alle manuelle pengeinndata. */
export function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Råstreng (etter trim/prefiksfjerning) → intern desimalstreng (f.eks. «1234.56») som `Number` kan lese, eller `null`.
 * Samme tolkelregler som `parseAmountImportNbNo` (for `allowTrailingComma: false`).
 */
export function normalizeNorwegianAmountToPlainDecimalString(
  raw: string,
  options: NormalizeNorwegianAmountOptions = {},
): string | null {
  const { allowTrailingComma = false } = options
  let s = raw.trim()
  if (!s) return null

  s = s.replace(/^(NOK|kr)\s*/i, '').replace(/\s*(NOK|kr|,-)$/i, '')
  s = s.trim()
  if (!s) return null

  if (s.startsWith('-')) return null

  s = s.replace(/[\s\u00a0\u202f]/g, '')

  if (allowTrailingComma && s.endsWith(',')) s += '0'

  const commaMatch = /^([^,]*),(\d{1,3})$/.exec(s)
  if (commaMatch) {
    const intPart = commaMatch[1]!.replace(/\./g, '')
    const decPart = commaMatch[2]!
    s = intPart + '.' + decPart
  } else {
    s = s.replace(/\./g, '')
  }

  if (!/^\d+(\.\d+)?$/.test(s)) return null
  return s
}

/**
 * Positivt beløp med inntil 2 desimaler (manuell registrering). Ugyldig / ikke-positivt → `NaN`.
 */
export function parsePositiveMoneyAmount2Decimals(s: string): number {
  const plain = normalizeNorwegianAmountToPlainDecimalString(s, { allowTrailingComma: true })
  if (plain == null) return NaN
  const n = roundMoney2(Number(plain))
  if (!Number.isFinite(n) || n <= 0) return NaN
  return n
}

/** Når `0` er et gyldig beløp (f.eks. budsjettlinje). Ugyldig → `NaN`. */
export function parseNonNegativeMoneyAmount2Decimals(s: string): number {
  const plain = normalizeNorwegianAmountToPlainDecimalString(s, { allowTrailingComma: true })
  if (plain == null) return NaN
  const n = roundMoney2(Number(plain))
  if (!Number.isFinite(n) || n < 0) return NaN
  return n
}

/** Vis i beløpsfelt (nb-NO, 0–2 des) – brukes ved blur/lagre. Kun for strengt positive beløp. */
export function formatMoneyInputFromNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return ''
  return n.toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/** Inkl. `0` (f.eks. budsjettlinje / referanse uden positivkraft). */
export function formatMoneyInputFromNonNegativeNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''
  if (n === 0) return '0'
  return n.toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const manualMoneyInputChars = /[^\d,.\s\u00a0\u202f]/g

/**
 * Under skriving: saniterer, legger inn nb-NO-tusenskille (mellomrom) i heltallsdelen,
 * og bevarer desimalkomma + inntil to desimaler. Brukes sammen med
 * `useFormattedMoneyInput` for stabil markør.
 */
export function formatMoneyAmountWhileTyping(raw: string): string {
  let s = raw.replace(manualMoneyInputChars, '')
  s = s.replace(/[\s\u00a0\u202f]/g, '')
  if (!s) return ''

  const lastCom = s.lastIndexOf(',')
  if (lastCom >= 0) {
    const intRaw = s.slice(0, lastCom).replace(/,/g, '').replace(/\./g, '')
    const intDigits = intRaw.replace(/[^\d]/g, '')
    const decDigits = s.slice(lastCom + 1).replace(/[^\d]/g, '').slice(0, 2)
    const trailingComma = s.endsWith(',') && decDigits === ''
    const n = intDigits === '' ? 0 : Number(intDigits)
    if (!Number.isFinite(n) || n < 0) {
      return raw
        .replace(manualMoneyInputChars, '')
        .replace(/[\s\u00a0\u202f]/g, '')
    }
    const intFmt = n.toLocaleString('nb-NO', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
    if (trailingComma) return `${intFmt},`
    return `${intFmt},${decDigits}`
  }

  const intOnly = s.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '')
  if (!intOnly) return ''
  const n = Number(intOnly)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('nb-NO', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
}
