/** Samme normalisering som transaksjons-CSV for kolonneoverskrifter. */
export function normalizeBankHeaderCell(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\u0308/g, '')
    .replace(/ø/g, 'o')
}
