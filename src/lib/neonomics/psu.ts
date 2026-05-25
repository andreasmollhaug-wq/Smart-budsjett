import { getNeonomicsConfig } from '@/lib/neonomics/config'
import { encryptPsuId } from '@/lib/neonomics/encryptPsuId'

/** Sandbox v1: encrypt configured test SSN. */
export function encryptSandboxPsuId(): string {
  const { sandboxPsuSsn, encryptionKeyRawValue } = getNeonomicsConfig()
  return encryptPsuId(sandboxPsuSsn, encryptionKeyRawValue)
}
