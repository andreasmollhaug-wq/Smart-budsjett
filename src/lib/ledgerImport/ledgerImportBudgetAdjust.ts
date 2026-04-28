import {
  budgetCategoryUsesIncomeWithholding,
  grossFromDesiredNet,
  withholdingPercentForBudgetCategory,
} from '@/lib/incomeWithholding'
import type { LedgerBudgetAdjustmentSnapshot } from '@/lib/ledgerImport/types'
import { categoryByNameMap } from '@/lib/ledgerImport/types'
import type { BudgetCategory, Transaction } from '@/lib/store'

export type LedgerBudgetAdjustReason = 'multi_year' | 'wrong_year' | 'empty'

export function parseCalendarYearFromIsoDate(dateStr: string): number | null {
  const t = dateStr.trim()
  if (t.length < 4) return null
  const y = Number(t.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

/** Måned 0–11 fra ISO YYYY-MM-DD. */
export function parseMonthIndexFromIsoDate(dateStr: string): number | null {
  const t = dateStr.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (!m) return null
  const mm = Number(m[2])
  if (!Number.isFinite(mm) || mm < 1 || mm > 12) return null
  return mm - 1
}

export function canApplyLedgerBudgetAdjust(
  transactions: Transaction[],
  appBudgetYear: number,
): { ok: true } | { ok: false; reason: LedgerBudgetAdjustReason } {
  if (!transactions.length) return { ok: false, reason: 'empty' }
  let firstYear: number | null = null
  for (const tx of transactions) {
    const y = parseCalendarYearFromIsoDate(tx.date ?? '')
    if (y == null) return { ok: false, reason: 'wrong_year' }
    if (firstYear == null) firstYear = y
    else if (y !== firstYear) return { ok: false, reason: 'multi_year' }
  }
  if (firstYear !== appBudgetYear) return { ok: false, reason: 'wrong_year' }
  return { ok: true }
}

function ensureTwelveBudgeted(budgeted: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const v = budgeted[i]
    return typeof v === 'number' && Number.isFinite(v) ? v : 0
  })
}

function deltaForTransaction(tx: Transaction, cat: BudgetCategory): number | null {
  const amt = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? tx.amount : 0
  const rounded = Math.round(amt)

  if (cat.type === 'expense') {
    return rounded
  }

  if (cat.type !== 'income') return null

  if (budgetCategoryUsesIncomeWithholding(cat)) {
    const net = rounded
    const p = withholdingPercentForBudgetCategory(cat)
    return grossFromDesiredNet(net, p)
  }

  return rounded
}

export interface ComputeLedgerBudgetDeltasResult {
  entries: LedgerBudgetAdjustmentSnapshot['entries']
  skippedHouseholdSplitCount: number
  skippedMissingCategoryCount: number
}

/**
 * Aggregerer budsjettøkning fra samme transaksjonsliste som innføres i store (1:1 med kartlegging).
 */
export function computeLedgerImportBudgetDeltas(
  transactions: Transaction[],
  pickerCategories: BudgetCategory[],
): ComputeLedgerBudgetDeltasResult {
  const byName = categoryByNameMap(pickerCategories)
  const agg = new Map<string, Map<number, number>>()
  let skippedHouseholdSplitCount = 0
  let skippedMissingCategoryCount = 0

  for (const tx of transactions) {
    const cat = byName.get(tx.category.trim())
    if (!cat || cat.type !== tx.type) {
      skippedMissingCategoryCount++
      continue
    }
    if (cat.householdSplit) {
      skippedHouseholdSplitCount++
      continue
    }

    const mi = parseMonthIndexFromIsoDate(tx.date ?? '')
    if (mi == null) continue

    const delta = deltaForTransaction(tx, cat)
    if (delta == null || delta === 0) continue

    let inner = agg.get(cat.id)
    if (!inner) {
      inner = new Map()
      agg.set(cat.id, inner)
    }
    inner.set(mi, (inner.get(mi) ?? 0) + delta)
  }

  const entries: LedgerBudgetAdjustmentSnapshot['entries'] = []
  for (const [categoryId, monthMap] of agg) {
    for (const [monthIndex, deltaApplied] of monthMap) {
      if (monthIndex < 0 || monthIndex > 11) continue
      entries.push({ categoryId, monthIndex, deltaApplied })
    }
  }
  entries.sort((a, b) => {
    const c = a.categoryId.localeCompare(b.categoryId, 'nb')
    if (c !== 0) return c
    return a.monthIndex - b.monthIndex
  })

  return { entries, skippedHouseholdSplitCount, skippedMissingCategoryCount }
}

/**
 * Legger inn manglende kategori­rader (typisk syntetiske fra mergeBudgetCategoriesForTransactionPicker)
 * slik at {@link applyLedgerBudgetAdjustmentToCategories} finner alle categoryId-er i entries.
 */
export function mergeBudgetCategoriesWithAdjustmentBackfill(
  budgetCategories: BudgetCategory[],
  entries: LedgerBudgetAdjustmentSnapshot['entries'],
  backfillCategories: BudgetCategory[] | undefined,
): BudgetCategory[] {
  if (!entries.length || !backfillCategories?.length) return budgetCategories
  const existingIds = new Set(budgetCategories.map((c) => c.id))
  const needed = new Set(entries.map((e) => e.categoryId))
  const additions: BudgetCategory[] = []
  for (const bf of backfillCategories) {
    if (!needed.has(bf.id) || existingIds.has(bf.id)) continue
    additions.push(bf)
    existingIds.add(bf.id)
  }
  return additions.length ? [...budgetCategories, ...additions] : budgetCategories
}

export function applyLedgerBudgetAdjustmentToCategories(
  categories: BudgetCategory[],
  entries: LedgerBudgetAdjustmentSnapshot['entries'],
): BudgetCategory[] {
  if (!entries.length) return categories
  const entryByCat = new Map<string, Map<number, number>>()
  for (const e of entries) {
    const inner = entryByCat.get(e.categoryId) ?? new Map<number, number>()
    inner.set(e.monthIndex, (inner.get(e.monthIndex) ?? 0) + e.deltaApplied)
    entryByCat.set(e.categoryId, inner)
  }
  return categories.map((c) => {
    const inner = entryByCat.get(c.id)
    if (!inner?.size) return c
    const budgeted = ensureTwelveBudgeted(c.budgeted)
    for (const [monthIndex, delta] of inner) {
      if (monthIndex < 0 || monthIndex > 11) continue
      budgeted[monthIndex] = (budgeted[monthIndex] ?? 0) + delta
    }
    return { ...c, budgeted }
  })
}

export function subtractLedgerBudgetAdjustmentFromCategories(
  categories: BudgetCategory[],
  entries: LedgerBudgetAdjustmentSnapshot['entries'],
): BudgetCategory[] {
  if (!entries.length) return categories
  const entryByCat = new Map<string, Map<number, number>>()
  for (const e of entries) {
    const inner = entryByCat.get(e.categoryId) ?? new Map<number, number>()
    inner.set(e.monthIndex, (inner.get(e.monthIndex) ?? 0) + e.deltaApplied)
    entryByCat.set(e.categoryId, inner)
  }
  return categories.map((c) => {
    const inner = entryByCat.get(c.id)
    if (!inner?.size) return c
    const budgeted = ensureTwelveBudgeted(c.budgeted)
    for (const [monthIndex, delta] of inner) {
      if (monthIndex < 0 || monthIndex > 11) continue
      budgeted[monthIndex] = Math.max(0, (budgeted[monthIndex] ?? 0) - delta)
    }
    return { ...c, budgeted }
  })
}
