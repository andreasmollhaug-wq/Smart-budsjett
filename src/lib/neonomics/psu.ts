import { getNeonomicsConfig } from '@/lib/neonomics/config'
import { encryptPsuId } from '@/lib/neonomics/encryptPsuId'
import { getNeonomicsBankEntry } from '@/lib/neonomics/bankCatalog'

/** Sandbox: kryptert x-psu-id for banker som krever personnummer (DNB, Sbanken). */
export function encryptSandboxPsuId(): string {
  const { sandboxPsuSsn, encryptionKeyRawValue } = getNeonomicsConfig()
  return encryptPsuId(sandboxPsuSsn, encryptionKeyRawValue)
}

/** Per bank: undefined når banken ikke krever x-psu-id (f.eks. Folio). */
export function psuIdForBank(bankId: string): string | undefined {
  const entry = getNeonomicsBankEntry(bankId)
  if (!entry?.requiresEncryptedPsuId) return undefined
  const { encryptionKeyRawValue, sandboxPsuSsn } = getNeonomicsConfig()
  const ssn = entry.sandboxPsuSsn?.trim() || sandboxPsuSsn
  return encryptPsuId(ssn, encryptionKeyRawValue)
}
