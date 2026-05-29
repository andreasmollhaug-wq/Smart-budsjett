import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const fetchNeonomicsBanksApi = vi.fn()

vi.mock('@/lib/neonomics/banks', () => ({
  fetchNeonomicsBanksApi: (...args: unknown[]) => fetchNeonomicsBanksApi(...args),
}))

import {
  bankSourceIdForNeonomicsBank,
  getUiNeonomicsBanks,
  refreshNeonomicsBankCatalog,
  resetNeonomicsBankCatalogCache,
} from '@/lib/neonomics/bankCatalog'
import { resetNeonomicsConfigCache } from '@/lib/neonomics/config'
import { psuIdForBank } from '@/lib/neonomics/psu'

const SANDBOX_BANKS = [
  {
    id: 'RG5iLm5vLnYxRE5CQU5PS0s=',
    bankDisplayName: 'DNB',
    bankingGroupName: 'DNB Group',
    personalIdentificationRequired: true,
    bankLogoUrl: 'https://example.com/dnb.png',
    status: 'AVAILABLE',
  },
  {
    id: 'U2Jhbmtlbi52MVNCQUtOT0JC',
    bankDisplayName: 'Sbanken',
    bankingGroupName: 'DNB Group',
    personalIdentificationRequired: true,
    status: 'AVAILABLE',
  },
  {
    id: 'Zm9saW8ubm9TUEFWTk9CQg==',
    bankDisplayName: 'Folio',
    bankingGroupName: 'Sparebanken Norge',
    personalIdentificationRequired: false,
    status: 'AVAILABLE',
  },
]

const ctx = { deviceId: 'test-device' }

describe('bankCatalog', () => {
  beforeEach(() => {
    resetNeonomicsConfigCache()
    resetNeonomicsBankCatalogCache()
    process.env.NEONOMICS_ENABLED = 'true'
    process.env.NEONOMICS_BASE_URL = 'https://sandbox.neonomics.io'
    process.env.NEONOMICS_CLIENT_ID = 'test'
    process.env.NEONOMICS_CLIENT_SECRET = 'secret'
    process.env.NEONOMICS_DEFAULT_BANK_ID = 'RG5iLm5vLnYxRE5CQU5PS0s='
    process.env.NEONOMICS_SANDBOX_PSU_SSN = '31125461118'
    process.env.NEONOMICS_ENCRYPTION_KEY_RAW_VALUE = 'YWFhYWFhYWFhYWFhYWFhYQ=='
    fetchNeonomicsBanksApi.mockReset()
    fetchNeonomicsBanksApi.mockResolvedValue(SANDBOX_BANKS)
  })

  it('henter UI-banker fra Neonomics API', async () => {
    await refreshNeonomicsBankCatalog(ctx)
    const names = getUiNeonomicsBanks().map((b) => b.displayName)
    expect(names).toEqual(['DNB', 'Sbanken', 'Folio'])
    expect(fetchNeonomicsBanksApi).toHaveBeenCalledWith(ctx)
  })

  it('mapper DNB til neonomics_dnb', async () => {
    await refreshNeonomicsBankCatalog(ctx)
    expect(bankSourceIdForNeonomicsBank('RG5iLm5vLnYxRE5CQU5PS0s=')).toBe('neonomics_dnb')
  })

  it('løser legacy Nordea/SpareBank 1 uten å vise dem i UI', async () => {
    await refreshNeonomicsBankCatalog(ctx)
    expect(bankSourceIdForNeonomicsBank('Tm9yZGVhLm5vLnYxTkRFQU5PS0s=')).toBe('neonomics_nordea')
    const names = getUiNeonomicsBanks().map((b) => b.displayName)
    expect(names).not.toContain('Nordea')
  })
})

describe('psuIdForBank', () => {
  beforeEach(() => {
    resetNeonomicsConfigCache()
    resetNeonomicsBankCatalogCache()
    process.env.NEONOMICS_ENABLED = 'true'
    process.env.NEONOMICS_BASE_URL = 'https://sandbox.neonomics.io'
    process.env.NEONOMICS_CLIENT_ID = 'test'
    process.env.NEONOMICS_CLIENT_SECRET = 'secret'
    process.env.NEONOMICS_DEFAULT_BANK_ID = 'RG5iLm5vLnYxRE5CQU5PS0s='
    process.env.NEONOMICS_SANDBOX_PSU_SSN = '31125461118'
    process.env.NEONOMICS_ENCRYPTION_KEY_RAW_VALUE = 'YWFhYWFhYWFhYWFhYWFhYQ=='
    fetchNeonomicsBanksApi.mockResolvedValue(SANDBOX_BANKS)
  })

  it('returnerer psu-id for DNB', async () => {
    await refreshNeonomicsBankCatalog(ctx)
    expect(psuIdForBank('RG5iLm5vLnYxRE5CQU5PS0s=')).toBeTruthy()
  })

  it('returnerer undefined for Folio (ingen x-psu-id)', async () => {
    await refreshNeonomicsBankCatalog(ctx)
    expect(psuIdForBank('Zm9saW8ubm9TUEFWTk9CQg==')).toBeUndefined()
  })
})
