import { parseAmountImportNbNo } from '@/lib/transactionImport/parseAmountImportNbNo'

/**
 * Beløp fra bankimport-kolonner (Inn / Ut fra konto).
 * Sparebank 1 og mange banker bruker negative tall i ut-kolonnen — vi lagrer alltid positivt
 * beløp; transaksjonstype (inntekt/utgift) settes ut fra hvilken kolonne som har verdi.
 */
export function parseBankColumnAmount(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return NaN
  const unsigned = trimmed.startsWith('-') ? trimmed.slice(1).trim() : trimmed
  if (!unsigned) return NaN
  return parseAmountImportNbNo(unsigned)
}

export type ResolveBankInnUtResult =
  | { ok: true; amount: number; transactionType: 'income' | 'expense' }
  | {
      ok: false
      reason: 'ambiguous_amount' | 'invalid_amount' | 'empty'
      detail?: string
    }

/** Felles Inn/Ut-logikk for DNB og Sparebank 1. */
export function resolveBankInnUtAmounts(utRaw: string, innRaw: string): ResolveBankInnUtResult {
  const utHasText = utRaw.length > 0
  const innHasText = innRaw.length > 0
  const utAmt = utHasText ? parseBankColumnAmount(utRaw) : NaN
  const innAmt = innHasText ? parseBankColumnAmount(innRaw) : NaN
  const hasUt = utHasText && Number.isFinite(utAmt)
  const hasInn = innHasText && Number.isFinite(innAmt)

  if (hasUt && hasInn) {
    return { ok: false, reason: 'ambiguous_amount', detail: 'Både ut og inn har beløp.' }
  }
  if (!hasUt && !hasInn) {
    if (utHasText || innHasText) {
      return { ok: false, reason: 'invalid_amount', detail: utRaw || innRaw }
    }
    return { ok: false, reason: 'empty' }
  }

  return {
    ok: true,
    amount: hasUt ? utAmt : innAmt,
    transactionType: hasUt ? 'expense' : 'income',
  }
}
