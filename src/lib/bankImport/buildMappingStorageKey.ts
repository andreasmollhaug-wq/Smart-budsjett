import { normalizeMappingKeyText } from '@/lib/bankImport/normalizeMappingKey'

const SEP = '\t'

/**
 * Lagringsnøkkel i `bankImportMappings`: skiller inn/ut med samme forklaringstekst.
 */
export function buildMappingStorageKey(
  forklaringRaw: string,
  transactionType: 'income' | 'expense',
): string {
  const text = normalizeMappingKeyText(forklaringRaw)
  return `${transactionType}${SEP}${text}`
}
