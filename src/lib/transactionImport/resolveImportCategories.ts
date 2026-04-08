import type { BudgetCategory } from '@/lib/store'
import type { ParsedTransactionRow } from '@/lib/transactionImport/parseTransactionCsv'

export type CategoryResolveResult =
  | { kind: 'matched'; canonical: string; type: 'income' | 'expense' }
  | { kind: 'unknown' }

/**
 * Matcher kategoritekst fra CSV mot samme liste som transaksjonsvelger (case-insensitive, nb).
 */
export function resolveCategoryForImport(raw: string, pickerCategories: BudgetCategory[]): CategoryResolveResult {
  const t = raw.trim()
  if (!t) return { kind: 'unknown' }
  for (const c of pickerCategories) {
    if (c.name.localeCompare(t, 'nb', { sensitivity: 'base' }) === 0) {
      return { kind: 'matched', canonical: c.name, type: c.type }
    }
  }
  return { kind: 'unknown' }
}

/** Unike kategoristrenger fra parsede rader som ikke finnes i picker. */
export function collectUnknownCategoryNames(
  rows: ParsedTransactionRow[],
  pickerCategories: BudgetCategory[],
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    const res = resolveCategoryForImport(r.categoryRaw, pickerCategories)
    if (res.kind === 'unknown') {
      const key = r.categoryRaw.trim()
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(key)
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'nb'))
}

/** Mulige duplikater: samme dato, beløp, beskrivelse og kategori som eksisterende transaksjon. */
export function countPotentialDuplicateRows(
  rows: ParsedTransactionRow[],
  canonicalNameForRaw: (raw: string) => string | null,
  existingTransactions: { date: string; amount: number; description: string; category: string }[],
): number {
  const existingSet = new Set(
    existingTransactions.map((t) =>
      `${t.date}|${t.amount}|${(t.description ?? '').trim()}|${t.category}`,
    ),
  )
  let n = 0
  for (const r of rows) {
    const canon = canonicalNameForRaw(r.categoryRaw)
    if (!canon) continue
    const key = `${r.dateIso}|${r.amount}|${r.description.trim()}|${canon}`
    if (existingSet.has(key)) n++
  }
  return n
}
