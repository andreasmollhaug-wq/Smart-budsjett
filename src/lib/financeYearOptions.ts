import type { ArchivedBudgetsByYear, Transaction } from '@/lib/store'

/** Maks år tilbake/frem for valg av aktivt budsjettår (onboarding / setBudgetYear). */
export const BUDGET_YEAR_OFFSET_MIN = -2
export const BUDGET_YEAR_OFFSET_MAX = 2

/**
 * Aktivt budsjettår ved oppstart: referenceYear + offset (stigende).
 * Visningsår fra transaksjoner kan gå lenger tilbake enn dette vinduet.
 */
export function buildSelectableActiveBudgetYearOptions(
  referenceYear = new Date().getFullYear(),
): number[] {
  const out: number[] = []
  for (let o = BUDGET_YEAR_OFFSET_MIN; o <= BUDGET_YEAR_OFFSET_MAX; o++) {
    out.push(referenceYear + o)
  }
  return out
}

export function isSelectableActiveBudgetYear(
  year: number,
  referenceYear = new Date().getFullYear(),
): boolean {
  const y = Math.floor(year)
  return (
    y >= referenceYear + BUDGET_YEAR_OFFSET_MIN && y <= referenceYear + BUDGET_YEAR_OFFSET_MAX
  )
}

/** Kalenderår fra ISO-dato (yyyy-mm-dd eller prefiks); null ved ugyldig. */
export function extractCalendarYearFromIsoDate(dateStr: string): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const part = dateStr.trim().split('T')[0]
  if (!part || part.length < 4) return null
  const y = Number(part.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

export type BuildFinanceViewYearOptionsInput = {
  budgetYear: number
  transactions: Transaction[]
  archivedBudgetsByYear?: ArchivedBudgetsByYear
  /** Nåværende viewingYear / filterYear — beholdes i listen selv uten txs. */
  selectedViewYear?: number
  /** Default true — matcher transaksjoner-siden. */
  includeCalendarYear?: boolean
}

/**
 * År som kan velges i vis-nedtrekk: aktivt budsjettår, arkiv, transaksjonsår (+ valgt visningsår).
 * Endrer ikke budgetYear.
 */
export function buildFinanceViewYearOptions(input: BuildFinanceViewYearOptionsInput): number[] {
  const s = new Set<number>()
  const by = Math.floor(input.budgetYear)
  if (Number.isFinite(by)) s.add(by)

  const sel = input.selectedViewYear
  if (sel !== undefined && Number.isFinite(sel)) s.add(Math.floor(sel))

  for (const t of input.transactions) {
    const y = extractCalendarYearFromIsoDate(t.date)
    if (y !== null) s.add(y)
  }

  const archive = input.archivedBudgetsByYear
  if (archive && typeof archive === 'object') {
    for (const key of Object.keys(archive)) {
      const n = Number(key)
      if (Number.isFinite(n)) s.add(n)
    }
  }

  const includeCal = input.includeCalendarYear !== false
  if (includeCal) s.add(new Date().getFullYear())

  return [...s].sort((a, b) => b - a)
}
