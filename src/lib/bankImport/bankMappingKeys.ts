import { normalizeMappingKeyText } from '@/lib/bankImport/normalizeMappingKey'
import type { BankImportMappingRule, BankParsedRow } from '@/lib/bankImport/types'

const SEP = '\t'
const MIN_STABLE_LEN = 4

/**
 * Normalisert forklaring ment for primær mapping-nøkkel: stripper ledende Giro+nummerserie
 * og enkel Avtalegiro-/forkortet «avt. giro»-støy, deretter samme normalisering som før.
 * For korte resultater fallbacks til full normalisert forklaring (som gamle nøkler).
 */
export function stableNormalizedForklaringForBankMapping(raw: string): string {
  let s = raw.trim()
  let prev = ''
  while (prev !== s) {
    prev = s
    s = s.replace(/^\s*giro\s*\d+\s*/i, '').trim()
  }
  while (/^\s*avtalegiro\b/i.test(s)) {
    s = s.replace(/^\s*avtalegiro\s*/i, '').trim()
  }
  while (/^\s*avt\.?\s*giro\s*/i.test(s)) {
    s = s.replace(/^\s*avt\.?\s*giro\s*/i, '').trim()
  }
  s = normalizeMappingKeyText(s)
  if (s.length < MIN_STABLE_LEN) {
    return normalizeMappingKeyText(raw)
  }
  return s
}

export function buildBankRowMappingKeys(
  forklaringRaw: string,
  transactionType: 'income' | 'expense',
): { primaryKey: string; legacyKey: string } {
  const legacyKey = `${transactionType}${SEP}${normalizeMappingKeyText(forklaringRaw)}`
  const primaryKey = `${transactionType}${SEP}${stableNormalizedForklaringForBankMapping(forklaringRaw)}`
  return { primaryKey, legacyKey }
}

export function resolveBankMappingCategoryName(
  maps: Record<string, BankImportMappingRule | undefined> | undefined,
  row: BankParsedRow,
): string | undefined {
  if (!maps) return undefined
  const p = maps[row.mappingKey]?.categoryName?.trim()
  if (p) return p
  const l = maps[row.mappingKeyLegacy]?.categoryName?.trim()
  return l || undefined
}
