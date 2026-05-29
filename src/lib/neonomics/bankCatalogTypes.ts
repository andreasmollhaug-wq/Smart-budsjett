import type { BankSourceId } from '@/lib/bankImport/types'

/** Klient-vennlig bankrad fra GET /api/bank/neonomics/banks. */
export type NeonomicsBankCatalogDto = {
  bankId: string
  displayName: string
  sourceId: BankSourceId
  logoUrl?: string
  bankingGroupName?: string
}
