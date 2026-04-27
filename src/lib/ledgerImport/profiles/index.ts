import type { LedgerSourceId } from '@/lib/ledgerImport/types'
import { CONTA_HOVEDBOK_PROFILE } from '@/lib/ledgerImport/profiles/conta'
import { GENERIC_LEDGER_PROFILE } from '@/lib/ledgerImport/profiles/generic'

const BY_SOURCE: Partial<Record<LedgerSourceId, typeof GENERIC_LEDGER_PROFILE>> = {
  conta: CONTA_HOVEDBOK_PROFILE,
  generic: GENERIC_LEDGER_PROFILE,
}

export function getLedgerProfileForSource(sourceId: LedgerSourceId) {
  const base = BY_SOURCE[sourceId] ?? GENERIC_LEDGER_PROFILE
  if (base.sourceId === sourceId) return base
  return {
    ...base,
    sourceId,
    id: `${sourceId}_hovedbok_v1`,
  }
}

export { CONTA_HOVEDBOK_PROFILE, GENERIC_LEDGER_PROFILE }
