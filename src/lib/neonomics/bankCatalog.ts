import 'server-only'

import type { BankSourceId } from '@/lib/bankImport/types'
import type { NeonomicsRequestContext } from '@/lib/neonomics/client'
import { fetchNeonomicsBanksApi, type NeonomicsApiBank } from '@/lib/neonomics/banks'
import { getNeonomicsConfig } from '@/lib/neonomics/config'
import type { NeonomicsBankCatalogDto } from '@/lib/neonomics/bankCatalogTypes'

export type { NeonomicsBankCatalogDto } from '@/lib/neonomics/bankCatalogTypes'

export type NeonomicsBankCatalogEntry = {
  bankId: string
  displayName: string
  sourceId: BankSourceId
  availableInUi: boolean
  /** Sandbox: kryptert x-psu-id når banken krever personnummer. */
  requiresEncryptedPsuId: boolean
  sandboxPsuSsn?: string
  logoUrl?: string
  bankingGroupName?: string
}

const DNB_BANK_ID = 'RG5iLm5vLnYxRE5CQU5PS0s='

/** Kjente bank-id → import-kilde (historikk/kartlegging). */
const SOURCE_ID_BY_BANK_ID: Record<string, BankSourceId> = {
  [DNB_BANK_ID]: 'neonomics_dnb',
  U2Jhbmtlbi52MVNCQUtOT0JC: 'neonomics_sbanken',
  'Zm9saW8ubm9TUEFWTk9CQg==': 'neonomics_folio',
  U3BhcmVCYW5rMU9zdGxhbmRldC5uby52MVNQUk9OTzIy: 'neonomics_sparebank1',
  'Tm9yZGVhLm5vLnYxTkRFQU5PS0s=': 'neonomics_nordea',
}

/** Sandbox-SSN per bank (Folio krever ikke x-psu-id). */
const SANDBOX_PSU_BY_BANK_ID: Record<string, string | undefined> = {
  U3BhcmVCYW5rMU9zdGxhbmRldC5uby52MVNQUk9OTzIy: '13039319955',
}

/** Eksisterende koblinger som kanskje ikke lenger er i /banks. */
const LEGACY_BANKS: NeonomicsBankCatalogEntry[] = [
  {
    bankId: 'U3BhcmVCYW5rMU9zdGxhbmRldC5uby52MVNQUk9OTzIy',
    displayName: 'SpareBank 1',
    sourceId: 'neonomics_sparebank1',
    availableInUi: false,
    requiresEncryptedPsuId: true,
    sandboxPsuSsn: '13039319955',
  },
  {
    bankId: 'Tm9yZGVhLm5vLnYxTkRFQU5PS0s=',
    displayName: 'Nordea',
    sourceId: 'neonomics_nordea',
    availableInUi: false,
    requiresEncryptedPsuId: true,
  },
]

const catalogById = new Map<string, NeonomicsBankCatalogEntry>()
let catalogFetchedAt = 0
const CATALOG_TTL_MS = 5 * 60 * 1000

function sourceIdForBank(bankId: string, displayName?: string): BankSourceId {
  const known = SOURCE_ID_BY_BANK_ID[bankId]
  if (known) return known
  try {
    const decoded = Buffer.from(bankId, 'base64').toString('utf8').toLowerCase()
    if (decoded.includes('dnb')) return 'neonomics_dnb'
    if (decoded.includes('sbanken')) return 'neonomics_sbanken'
    if (decoded.includes('folio')) return 'neonomics_folio'
    if (decoded.includes('nordea')) return 'neonomics_nordea'
    if (decoded.includes('sparebank')) return 'neonomics_sparebank1'
  } catch {
    // ignore invalid base64
  }
  const name = (displayName ?? '').toLowerCase()
  if (name.includes('dnb')) return 'neonomics_dnb'
  if (name.includes('sbanken')) return 'neonomics_sbanken'
  if (name.includes('folio')) return 'neonomics_folio'
  if (name.includes('nordea')) return 'neonomics_nordea'
  if (name.includes('sparebank')) return 'neonomics_sparebank1'
  return 'neonomics_dnb'
}

function mapApiBankToEntry(bank: NeonomicsApiBank): NeonomicsBankCatalogEntry {
  const bankId = bank.id.trim()
  const displayName =
    bank.bankDisplayName?.trim() || bank.bankOfficialName?.trim() || bank.bankingGroupName?.trim() || 'Bank'
  return {
    bankId,
    displayName,
    sourceId: sourceIdForBank(bankId, displayName),
    availableInUi: true,
    requiresEncryptedPsuId: bank.personalIdentificationRequired !== false,
    sandboxPsuSsn: SANDBOX_PSU_BY_BANK_ID[bankId],
    logoUrl: bank.bankLogoUrl,
    bankingGroupName: bank.bankingGroupName,
  }
}

function mergeCatalog(entries: NeonomicsBankCatalogEntry[]): void {
  catalogById.clear()
  for (const b of LEGACY_BANKS) {
    catalogById.set(b.bankId, b)
  }
  for (const b of entries) {
    catalogById.set(b.bankId, b)
  }
}

function isCatalogFresh(): boolean {
  return catalogById.size > 0 && Date.now() - catalogFetchedAt < CATALOG_TTL_MS
}

/** Henter bankliste fra Neonomics og oppdaterer server-cache. */
export async function refreshNeonomicsBankCatalog(ctx: NeonomicsRequestContext): Promise<void> {
  getNeonomicsConfig()
  const apiBanks = await fetchNeonomicsBanksApi(ctx)
  mergeCatalog(apiBanks.map(mapApiBankToEntry))
  catalogFetchedAt = Date.now()
}

async function ensureCatalog(ctx?: NeonomicsRequestContext): Promise<void> {
  if (isCatalogFresh()) return
  if (!ctx) {
    mergeCatalog(fallbackSandboxCatalog())
    return
  }
  await refreshNeonomicsBankCatalog(ctx)
}

function fallbackSandboxCatalog(): NeonomicsBankCatalogEntry[] {
  return [
    {
      bankId: DNB_BANK_ID,
      displayName: 'DNB',
      sourceId: 'neonomics_dnb',
      availableInUi: true,
      requiresEncryptedPsuId: true,
      logoUrl:
        'https://storage.googleapis.com/neonomics-checkout-public-uploads-production/bank-logos/DNB.png',
    },
    {
      bankId: 'U2Jhbmtlbi52MVNCQUtOT0JC',
      displayName: 'Sbanken',
      sourceId: 'neonomics_sbanken',
      availableInUi: true,
      requiresEncryptedPsuId: true,
      logoUrl:
        'https://storage.googleapis.com/neonomics-checkout-public-uploads-production/bank-logos/Sbanken.png',
    },
    {
      bankId: 'Zm9saW8ubm9TUEFWTk9CQg==',
      displayName: 'Folio',
      sourceId: 'neonomics_folio',
      availableInUi: true,
      requiresEncryptedPsuId: false,
      logoUrl:
        'https://storage.googleapis.com/neonomics-checkout-public-uploads-production/bank-logos/Folio.png',
    },
  ]
}

export function getNeonomicsBankCatalog(): NeonomicsBankCatalogEntry[] {
  if (catalogById.size === 0) {
    mergeCatalog(fallbackSandboxCatalog())
  }
  return [...catalogById.values()]
}

export function getUiNeonomicsBanks(): NeonomicsBankCatalogEntry[] {
  return getNeonomicsBankCatalog().filter((b) => b.availableInUi)
}

export function getNeonomicsBankEntry(bankId: string): NeonomicsBankCatalogEntry | null {
  const id = bankId.trim()
  return getNeonomicsBankCatalog().find((b) => b.bankId === id) ?? null
}

export async function resolveNeonomicsBankIdAsync(
  bankId: string | null | undefined,
  ctx: NeonomicsRequestContext,
  opts?: { displayName?: string },
): Promise<NeonomicsBankCatalogEntry> {
  await ensureCatalog(ctx)
  const trimmed = bankId?.trim()
  if (trimmed) {
    const entry = getNeonomicsBankEntry(trimmed)
    if (entry) return entry
    return {
      bankId: trimmed,
      displayName: opts?.displayName?.trim() || 'Bank',
      sourceId: sourceIdForBank(trimmed, opts?.displayName),
      availableInUi: false,
      requiresEncryptedPsuId: true,
    }
  }
  const ui = getUiNeonomicsBanks()
  const dnb = ui.find((b) => b.sourceId === 'neonomics_dnb') ?? ui[0]
  if (!dnb) throw new Error('Ingen bank tilgjengelig fra Neonomics.')
  return dnb
}

/** Synkron oppslag — bruk etter refresh/ensureCatalog eller for legacy-id. */
export function resolveNeonomicsBankId(bankId?: string | null): NeonomicsBankCatalogEntry {
  const trimmed = bankId?.trim()
  if (trimmed) {
    const entry = getNeonomicsBankEntry(trimmed)
    if (entry) return entry
    throw new Error(`Ukjent bank (${trimmed}).`)
  }
  const ui = getUiNeonomicsBanks()
  const dnb = ui.find((b) => b.sourceId === 'neonomics_dnb') ?? ui[0]
  if (!dnb) throw new Error('Ingen bank konfigurert.')
  return dnb
}

export function bankSourceIdForNeonomicsBank(bankId: string): BankSourceId {
  const entry = getNeonomicsBankEntry(bankId)
  if (entry) return entry.sourceId
  return sourceIdForBank(bankId)
}

export function bankCatalogToDto(entry: NeonomicsBankCatalogEntry): NeonomicsBankCatalogDto {
  return {
    bankId: entry.bankId,
    displayName: entry.displayName,
    sourceId: entry.sourceId,
    logoUrl: entry.logoUrl,
    bankingGroupName: entry.bankingGroupName,
  }
}

/** Kun tester — nullstill cache mellom testkjøringer. */
export function resetNeonomicsBankCatalogCache(): void {
  catalogById.clear()
  catalogFetchedAt = 0
}
