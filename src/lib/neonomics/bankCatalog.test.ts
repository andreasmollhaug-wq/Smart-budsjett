import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { bankSourceIdForNeonomicsBank } from '@/lib/neonomics/bankCatalog'
import { resetNeonomicsConfigCache } from '@/lib/neonomics/config'

describe('bankCatalog', () => {
  beforeEach(() => {
    resetNeonomicsConfigCache()
    process.env.NEONOMICS_ENABLED = 'true'
    process.env.NEONOMICS_BASE_URL = 'https://sandbox.neonomics.io'
    process.env.NEONOMICS_CLIENT_ID = 'test'
    process.env.NEONOMICS_CLIENT_SECRET = 'secret'
    process.env.NEONOMICS_DEFAULT_BANK_ID = 'bank-dnb-id'
    process.env.NEONOMICS_SANDBOX_PSU_SSN = '31125461118'
    process.env.NEONOMICS_ENCRYPTION_KEY_RAW_VALUE = 'dGVzdGtleXRlc3RrZXl0ZXN0a2V5MTI='
  })

  it('mapper default bank til neonomics_dnb', () => {
    expect(bankSourceIdForNeonomicsBank('bank-dnb-id')).toBe('neonomics_dnb')
  })
})
