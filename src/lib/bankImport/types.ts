import type { LedgerBudgetAdjustmentSnapshot } from '@/lib/ledgerImport/types'

export type BankSourceId =
  | 'dnb_sbanken'
  | 'sparebank1'
  | 'neonomics_dnb'
  | 'neonomics_sbanken'
  | 'neonomics_folio'
  | 'neonomics_sparebank1'
  | 'neonomics_nordea'

export interface BankImportMappingRule {
  categoryName: string
}

export type BankImportMappingsState = Partial<Record<BankSourceId, Record<string, BankImportMappingRule>>>

/** Én linje som ble importert (arkivert for historikk). */
export interface BankImportLineSnapshot {
  fileLine: number
  dateIso: string
  rentedatoIso?: string
  forklaringRaw: string
  amount: number
  categoryName: string
  type: 'income' | 'expense'
  /** Tekst lagret på transaksjonen. */
  transactionDescription: string
}

export interface BankImportRun {
  id: string
  createdAt: string
  sourceId: BankSourceId
  profileId: string
  csvProfileId: string
  fileName: string | null
  displayName?: string | null
  rowCountParsed: number
  rowCountImported: number
  rowCountSkipped: number
  errorSummary: string | null
  importedLines?: BankImportLineSnapshot[]
  budgetAdjustment?: LedgerBudgetAdjustmentSnapshot
  accountSummaries?: { accountId: string; label: string; imported: number; pending: number }[]
}

export type BankParseRowErrorReason =
  | 'invalid_date'
  | 'invalid_amount'
  | 'ambiguous_amount'
  | 'empty_row'
  | 'missing_description'

export interface BankParseRowError {
  fileLine: number
  reason: BankParseRowErrorReason
  detail?: string
}

export interface BankParsedRow {
  fileLine: number
  dateIso: string
  rentedatoIso?: string
  forklaringRaw: string
  /**
   * Primær lagringsnøkkel (stabil leverandørtekst; ledende Giro+nr m.m. normaliseres vekk).
   * Se bankMappingKeys.ts.
   */
  mappingKey: string
  /** Sekundær nøkkel = full normalisert forklaring (som før v2); brukes ved oppslag og fan-out i import. */
  mappingKeyLegacy: string
  amount: number
  transactionType: 'income' | 'expense'
  /** Satt ved Neonomics-sync for deduplisering ved import. */
  externalBankTxId?: string
  /** Neonomics account.id — hvilken bankkonto raden kom fra. */
  externalBankAccountId?: string
  externalBankAccountLabel?: string
}

export interface ParseBankFileResult {
  rows: BankParsedRow[]
  rowErrors: BankParseRowError[]
}

/** Ukartlagte Neonomics-rader lagret i user_app_state (cron/manuell hent). */
export type BankPendingNeonomicsPayload = {
  profileId: string
  bankId: string
  bankDisplayName: string
  rows: BankParsedRow[]
  label: string
  updatedAt: string
  fetchedCount: number
  duplicateCount: number
}

export type BankPendingNeonomicsState = Record<string, BankPendingNeonomicsPayload>
