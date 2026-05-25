import type { BankParsedRow } from '@/lib/bankImport/types'

const STORAGE_KEY = 'dottir_neonomics_pending_import'

export type NeonomicsPendingImportPayload = {
  profileId: string
  rows: BankParsedRow[]
  label: string
  fetchedCount: number
  duplicateCount: number
}

export function saveNeonomicsPendingImport(payload: NeonomicsPendingImportPayload): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function consumeNeonomicsPendingImport(): NeonomicsPendingImportPayload | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  sessionStorage.removeItem(STORAGE_KEY)
  try {
    return JSON.parse(raw) as NeonomicsPendingImportPayload
  } catch {
    return null
  }
}
