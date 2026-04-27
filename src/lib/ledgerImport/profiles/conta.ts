import type { LedgerCsvProfile } from '@/lib/ledgerImport/types'

/**
 * Conta hovedbok CSV (UTF-8): én beløpsk kolonne «Beløp (NOK)», konto som «1500 Kundefordring».
 * Balansekontoer under 3000 hoppes over (NS 4102-resultat fra 3000+).
 */
export const CONTA_HOVEDBOK_PROFILE: LedgerCsvProfile = {
  id: 'conta_hovedbok_v1',
  sourceId: 'conta',
  delimiter: ';',
  dateFormat: 'dd.MM.yyyy',
  accountCodeExtract: 'leadingNumber',
  minAccountNumberInclusive: 3000,
  headers: {
    date: ['dato', 'bilagsdato', 'posteringsdato'],
    accountCode: ['konto', 'kontonummer', 'kontokode'],
    voucherRef: ['bilag', 'bilagsnummer', 'bilagsnr'],
    description: ['tekst', 'beskrivelse', 'merknad'],
    amount: ['belop (nok)', 'belop', 'beløp'],
  },
  amountModel: 'singleSigned',
  /** To desimaler (øre), bankavrunding — små poster under 1 kr og finans (8060 mv.) tas med. */
  amountPrecision: 'ore',
  singleSignedExpenseIsNegative: true,
}
