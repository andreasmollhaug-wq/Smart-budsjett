/**
 * Visning av beløp i regnskapsimport (alltid 2 desimaler, samsvar med lagret verdi ved amountPrecision ore).
 */
export function formatLedgerImportAmountNb(n: number): string {
  return n.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
