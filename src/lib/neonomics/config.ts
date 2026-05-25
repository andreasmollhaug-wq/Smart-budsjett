import 'server-only'
import { readFileSync } from 'fs'
import { isNeonomicsServerEnabled } from '@/lib/neonomics/feature'

export type NeonomicsConfig = {
  baseUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  defaultBankId: string
  sandboxPsuSsn: string
  deviceIdPrefix: string
  encryptionKeyRawValue: string
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Manglende miljøvariabel: ${name}`)
  return v
}

function loadEncryptionRawValue(): string {
  const jsonPath = process.env.NEONOMICS_ENCRYPTION_KEY_JSON_PATH?.trim()
  if (jsonPath) {
    const raw = readFileSync(jsonPath, 'utf8')
    const parsed = JSON.parse(raw) as {
      rawValue?: string
      key?: { keyData?: { rawValue?: string } }[]
    }
    const fromKey = parsed.key?.[0]?.keyData?.rawValue
    const value = fromKey ?? parsed.rawValue
    if (!value?.trim()) {
      throw new Error('Neonomics encryption key JSON mangler key[0].keyData.rawValue')
    }
    return value.trim()
  }
  const inline = process.env.NEONOMICS_ENCRYPTION_KEY_RAW_VALUE?.trim()
  if (inline) return inline
  throw new Error(
    'Sett NEONOMICS_ENCRYPTION_KEY_JSON_PATH eller NEONOMICS_ENCRYPTION_KEY_RAW_VALUE',
  )
}

let cachedConfig: NeonomicsConfig | null = null

/** Loaded config when NEONOMICS_ENABLED=true; throws if misconfigured. */
export function getNeonomicsConfig(): NeonomicsConfig {
  if (!isNeonomicsServerEnabled()) {
    throw new Error('Neonomics er ikke aktivert (NEONOMICS_ENABLED)')
  }
  if (cachedConfig) return cachedConfig
  const baseUrl = requireEnv('NEONOMICS_BASE_URL').replace(/\/$/, '')
  cachedConfig = {
    baseUrl,
    tokenUrl:
      process.env.NEONOMICS_TOKEN_URL?.trim() ||
      `${baseUrl}/auth/realms/sandbox/protocol/openid-connect/token`,
    clientId: requireEnv('NEONOMICS_CLIENT_ID'),
    clientSecret: requireEnv('NEONOMICS_CLIENT_SECRET'),
    defaultBankId: requireEnv('NEONOMICS_DEFAULT_BANK_ID'),
    sandboxPsuSsn: requireEnv('NEONOMICS_SANDBOX_PSU_SSN'),
    deviceIdPrefix: process.env.NEONOMICS_DEVICE_ID_PREFIX?.trim() || 'dottir',
    encryptionKeyRawValue: loadEncryptionRawValue(),
  }
  return cachedConfig
}

/** Reset cache (tests). */
export function resetNeonomicsConfigCache(): void {
  cachedConfig = null
}
