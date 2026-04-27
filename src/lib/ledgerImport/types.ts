import type { BudgetCategory } from '@/lib/store'

export type LedgerSourceId = 'conta' | 'tripletex' | 'fiken' | 'twentyfourseven' | 'generic'

export type LedgerAmountModel = 'debitCredit' | 'singleSigned'

/** Regel: ikke-null debet på linje tolkes som utgift, kredit som inntekt (eller omvendt). */
export type DebitCreditIncomeSide = 'credit' | 'debit'

/** Hvordan kontonummer leses fra «Konto»-cellen. Standard: fjern mellomrom (generisk). */
export type LedgerAccountCodeExtract = 'compact' | 'leadingNumber'

export interface LedgerCsvProfile {
  id: string
  sourceId: LedgerSourceId
  delimiter: ';' | ','
  /** dd.MM.yyyy eller yyyy-MM-dd */
  dateFormat: 'dd.MM.yyyy' | 'yyyy-MM-dd'
  /**
   * leadingNumber: ledende siffer blir konto, resten av cellen brukes som kontonavn (f.eks. Conta «1500 Kundefordring»).
   * @default 'compact' (normalizeLedgerAccountCode)
   */
  accountCodeExtract?: LedgerAccountCodeExtract
  /**
   * NS 4102-orientert: rader med kontonummer strengt under denne verdien hoppes stille over (balanse).
   * Eksempel: 3000 beholder resultatkontoer 3000+.
   */
  minAccountNumberInclusive?: number
  /** Normaliserte overskrifter (små bokstaver, æøå → ae o) som i transactionImport */
  headers: {
    date: string[]
    accountCode: string[]
    accountName?: string[]
    voucherRef?: string[]
    description?: string[]
    debit?: string[]
    credit?: string[]
    /** Én kolonne med beløp; fortegn eller tolkning via singleSignedExpenseIsNegative */
    amount?: string[]
  }
  amountModel: LedgerAmountModel
  /**
   * integer (standard): beløp avrundes til hele kroner.
   * ore: nøyaktig to desimaler (øre, bankavrunding) — samme presisjon som transaksjoner med desimalvisning i appen.
   */
  amountPrecision?: 'integer' | 'ore'
  /** Kun for debitCredit: hvilken side som øker inntektskonto i eksporten (typisk kredit). */
  incomeOnSide?: DebitCreditIncomeSide
  /**
   * Kun for singleSigned: true hvis negative beløp er utgifter og positive inntekter
   * (eller motsatt — juster profil når ekte fil foreligger).
   */
  singleSignedExpenseIsNegative?: boolean
}

export interface CanonicalLedgerLine {
  fileLine: number
  dateIso: string
  accountCode: string
  accountName: string
  voucherRef: string
  description: string
  /** Alltid > 0 etter parse (hele kroner, eller nøyaktig to desimaler ved amountPrecision ore). */
  amount: number
  /** Fra debet/kredit-regel eller fortegn — brukes i sammendrag; endelig type følger valgt kategori ved import. */
  ledgerSide: 'income' | 'expense'
}

export type LedgerParseRowErrorReason =
  | 'invalid_date'
  | 'invalid_amount'
  | 'ambiguous_amount'
  | 'zero_amount'
  | 'missing_account'

export interface LedgerParseRowError {
  fileLine: number
  reason: LedgerParseRowErrorReason
  detail?: string
}

export type LedgerHeldBackReason = 'empty_voucher'

/** Linje som er gyldig parsert men holdes tilbake (f.eks. tomt bilag); bruker kan ta med i UI. */
export interface LedgerHeldBackLine {
  line: CanonicalLedgerLine
  reason: LedgerHeldBackReason
}

export interface ParseLedgerCsvResult {
  lines: CanonicalLedgerLine[]
  /** Rader med bilagskolonne men uten ekte bilagsverdi — vises i «tatt ut»-listen. */
  heldBackLines: LedgerHeldBackLine[]
  rowErrors: LedgerParseRowError[]
  delimiter: ';' | ','
}

/** Lagret brukermapping: kontonummer → kategori (type utledes fra kategori ved import). */
export interface LedgerAccountMappingRule {
  categoryName: string
}

/** Én linje som faktisk ble importert til transaksjoner (arkivert ved import for historikk). */
export interface LedgerImportLineSnapshot {
  /** Radnummer i opplastet fil (1-basert). */
  fileLine: number
  dateIso: string
  amount: number
  accountCode: string
  accountName: string
  voucherRef: string
  /** Rå beskrivelse fra fil. */
  description: string
  /** Tekst som ble lagret på transaksjonen i appen. */
  transactionDescription: string
  categoryName: string
  type: 'income' | 'expense'
  /** Side i regnskapsfil før kategori (informativt). */
  ledgerSide: 'income' | 'expense'
}

export interface LedgerImportRun {
  id: string
  createdAt: string
  sourceId: LedgerSourceId
  /** Brukerprofil (husholdning) transaksjoner knyttes til */
  profileId: string
  csvProfileId: string
  fileName: string | null
  /** Valgfritt navn brukeren gir importen (vises i historikk). */
  displayName?: string | null
  rowCountParsed: number
  rowCountImported: number
  rowCountSkipped: number
  errorSummary: string | null
  /** Alle linjer som ble til transaksjoner (nye importer); vises i detaljmodal uavhengig av sletting. */
  importedLines?: LedgerImportLineSnapshot[]
}

export type LedgerAccountMappingsState = Partial<Record<LedgerSourceId, Record<string, LedgerAccountMappingRule>>>

/** categoryName → BudgetCategory fra picker (for type-utledning). */
export function categoryByNameMap(cats: BudgetCategory[]): Map<string, BudgetCategory> {
  const m = new Map<string, BudgetCategory>()
  for (const c of cats) {
    const k = c.name.trim()
    if (k) m.set(k, c)
  }
  return m
}
