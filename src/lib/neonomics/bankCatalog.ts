import 'server-only'
import type { BankSourceId } from '@/lib/bankImport/types'
import { getNeonomicsConfig } from '@/lib/neonomics/config'

export type NeonomicsBankCatalogEntry = {
  bankId: string
  displayName: string
  sourceId: BankSourceId
  availableInUi: boolean
}

/** Sandbox/prod bank entries known to the app. v1.6 UI exposes only DNB. */
export function getNeonomicsBankCatalog(): NeonomicsBankCatalogEntry[] {
  const { defaultBankId } = getNeonomicsConfig()
  return [
    {
      bankId: defaultBankId,
      displayName: 'DNB',
      sourceId: 'neonomics_dnb',
      availableInUi: true,
    },
  ]
}

export function getNeonomicsBankEntry(bankId: string): NeonomicsBankCatalogEntry | null {
  const id = bankId.trim()
  return getNeonomicsBankCatalog().find((b) => b.bankId === id) ?? null
}

export function resolveNeonomicsBankId(bankId?: string | null): NeonomicsBankCatalogEntry {
  const trimmed = bankId?.trim()
  if (trimmed) {
    const entry = getNeonomicsBankEntry(trimmed)
    if (entry) return entry
  }
  const catalog = getNeonomicsBankCatalog()
  const dnb = catalog.find((b) => b.availableInUi)
  if (!dnb) throw new Error('Ingen bank konfigurert i katalogen.')
  return dnb
}

export function bankSourceIdForNeonomicsBank(bankId: string): BankSourceId {
  return resolveNeonomicsBankId(bankId).sourceId
}
