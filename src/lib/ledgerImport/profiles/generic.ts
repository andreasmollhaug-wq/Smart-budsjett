import type { LedgerCsvProfile } from '@/lib/ledgerImport/types'

/**
 * Generisk hovedbok-profil for testing og «Annet».
 * Juster `headers` når ekte eksportfiler fra leverandører foreligger.
 */
export const GENERIC_LEDGER_PROFILE: LedgerCsvProfile = {
  id: 'generic_hovedbok_v1',
  sourceId: 'generic',
  delimiter: ';',
  dateFormat: 'dd.MM.yyyy',
  headers: {
    date: ['dato', 'bilagsdato', 'posteringsdato'],
    accountCode: ['konto', 'kontonummer', 'kontokode'],
    accountName: ['kontonavn', 'kontobeskrivelse'],
    voucherRef: ['bilag', 'bilagsnummer', 'bilagsnr'],
    description: ['tekst', 'beskrivelse', 'merknad'],
    debit: ['debet', 'debit'],
    credit: ['kredit', 'credit'],
  },
  amountModel: 'debitCredit',
  incomeOnSide: 'credit',
}
