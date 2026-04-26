import type { BudgetVsActualRow } from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import { formatNOK, formatPercent, variancePercentOfBudget } from '@/lib/utils'

/** Avvik-farge for gruppetotal: inntektsgruppe som inntekt, ellers utgift. */
export function parentCategoryToAggregateLineType(group: ParentCategory): 'income' | 'expense' {
  return group === 'inntekter' ? 'income' : 'expense'
}

/** Summer alle linjer i gruppen måned for måned (0–11) til syntetiske rader for matrisen. */
export function buildGroupAggregateMonthArrays(
  cats: BudgetCategory[],
  actualMatrix: Map<string, number[]>,
  budgetMatrix: Map<string, number[]>,
): { actual: number[]; budget: number[] } {
  const actual = new Array<number>(12).fill(0)
  const budget = new Array<number>(12).fill(0)
  for (const c of cats) {
    const a = actualMatrix.get(c.name)
    const b = budgetMatrix.get(c.name)
    for (let m = 0; m < 12; m++) {
      actual[m] += a?.[m] ?? 0
      budget[m] += b?.[m] ?? 0
    }
  }
  return { actual, budget }
}

export type ArsvisningLineFilterMode = 'all' | 'unfavorable' | 'favorable'

export const DEFAULT_ARSVISNING_LINE_FILTER: ArsvisningLineFilterMode = 'all'

export const ARSVISNING_LINE_FILTER_STORAGE_KEY = 'smartbudsjett:arsvisning:lineFilter'

export const ARSVISNING_LINE_FILTER_OPTIONS: { value: ArsvisningLineFilterMode; label: string }[] = [
  { value: 'all', label: 'Alle linjer' },
  { value: 'unfavorable', label: 'Avvik over budsjett' },
  { value: 'favorable', label: 'Bedre enn budsjett' },
]

export function parseStoredArsvisningLineFilter(raw: string | null): ArsvisningLineFilterMode {
  if (!raw || typeof raw !== 'string') return DEFAULT_ARSVISNING_LINE_FILTER
  try {
    const v = JSON.parse(raw) as unknown
    if (v === 'all' || v === 'unfavorable' || v === 'favorable') return v
  } catch {
    /* ignore */
  }
  return DEFAULT_ARSVISNING_LINE_FILTER
}

/**
 * Kategori-IDer som matcher filtermodus for valgt periode (via budgetVsRows).
 * `null` betyr ingen filtrering (vis alle linjer).
 */
export function filterCategoryIdsForArsvisningLineFilter(
  rows: BudgetVsActualRow[],
  mode: ArsvisningLineFilterMode,
): Set<string> | null {
  if (mode === 'all') return null
  const ids = new Set<string>()
  for (const r of rows) {
    const unfavorable =
      (r.type === 'expense' && r.variance > 0) || (r.type === 'income' && r.variance < 0)
    const favorable =
      (r.type === 'expense' && r.variance < 0) || (r.type === 'income' && r.variance > 0)
    if (mode === 'unfavorable' && unfavorable) ids.add(r.categoryId)
    if (mode === 'favorable' && favorable) ids.add(r.categoryId)
  }
  return ids
}

export type ArsvisningRowKey = 'actual' | 'budget' | 'variance' | 'variancePct'

export type ArsvisningRowVisibility = Record<ArsvisningRowKey, boolean>

export const DEFAULT_ARSVISNING_ROW_VISIBILITY: ArsvisningRowVisibility = {
  actual: true,
  budget: true,
  variance: false,
  variancePct: false,
}

export const ARSVISNING_ROW_TOGGLES_STORAGE_KEY = 'smartbudsjett:arsvisning:rowToggles'

export const ARSVISNING_ROW_ORDER: ArsvisningRowKey[] = ['actual', 'budget', 'variance', 'variancePct']

export const ARSVISNING_ROW_LABELS: Record<ArsvisningRowKey, string> = {
  actual: 'Faktisk',
  budget: 'Budsjett',
  variance: 'Avvik',
  variancePct: 'Avvik %',
}

export function parseStoredArsvisningRowVisibility(raw: string | null): ArsvisningRowVisibility | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const next = { ...DEFAULT_ARSVISNING_ROW_VISIBILITY }
    for (const k of ARSVISNING_ROW_ORDER) {
      if (typeof o[k] === 'boolean') next[k] = o[k] as boolean
    }
    if (!ARSVISNING_ROW_ORDER.some((k) => next[k])) return null
    return next
  } catch {
    return null
  }
}

/** Samme semantikk som BudgetVsActualTables.varianceColor — returnerer CSS-farge. */
export function varianceTextColorForLine(
  type: 'income' | 'expense',
  variance: number,
): 'muted' | 'good' | 'bad' {
  if (variance === 0) return 'muted'
  if (type === 'expense' && variance > 0) return 'bad'
  if (type === 'income' && variance < 0) return 'bad'
  return 'good'
}

export function varianceCssColor(tone: 'muted' | 'good' | 'bad'): string {
  if (tone === 'muted') return 'var(--text-muted)'
  if (tone === 'bad') return 'var(--danger)'
  return 'var(--success)'
}

/** Subtil bakgrunn for «bra» avvik-celler — grønn uten å dominere tabellen. */
export function varianceCellBackground(tone: 'muted' | 'good' | 'bad'): string | undefined {
  if (tone !== 'good') return undefined
  return 'color-mix(in srgb, var(--success) 14%, transparent)'
}

export function isCalendarFutureMonth(year: number, monthIndex: number, now: Date = new Date()): boolean {
  const cy = now.getFullYear()
  const cm = now.getMonth()
  if (year > cy) return true
  if (year < cy) return false
  return monthIndex > cm
}

export function monthVariance(actual: number[] | undefined, budget: number[] | undefined, mi: number): number {
  const a = actual?.[mi] ?? 0
  const b = budget?.[mi] ?? 0
  return a - b
}

export function sumTwelve(row: number[] | undefined): number {
  if (!row) return 0
  let s = 0
  for (let i = 0; i < 12; i++) s += row[i] ?? 0
  return s
}

export function formatVariancePctCell(
  type: 'income' | 'expense',
  actual: number[] | undefined,
  budget: number[] | undefined,
  mi: number,
): { text: string; tone: 'muted' | 'good' | 'bad' } {
  const v = monthVariance(actual, budget, mi)
  const b = budget?.[mi] ?? 0
  const pct = variancePercentOfBudget(v, b)
  if (pct === null) {
    return { text: '–', tone: 'muted' }
  }
  const tone = varianceTextColorForLine(type, v)
  const sign = pct > 0 ? '+' : ''
  return { text: `${sign}${formatPercent(pct)}`, tone }
}

export function formatVariancePctYearSummary(
  type: 'income' | 'expense',
  actual: number[] | undefined,
  budget: number[] | undefined,
): { text: string; tone: 'muted' | 'good' | 'bad' } {
  const sumA = sumTwelve(actual)
  const sumB = sumTwelve(budget)
  const v = sumA - sumB
  const pct = variancePercentOfBudget(v, sumB)
  if (pct === null) {
    return { text: '–', tone: 'muted' }
  }
  const tone = varianceTextColorForLine(type, v)
  const sign = pct > 0 ? '+' : ''
  return { text: `${sign}${formatPercent(pct)}`, tone }
}

/** Snitt for %-rad: enkel modell — «–» (unngår tvetydig gjennomsnitt av prosent). */
export function formatVariancePctAveragePlaceholder(): string {
  return '–'
}

export function formatMatrixCell(
  kind: ArsvisningRowKey,
  type: 'income' | 'expense',
  actual: number[] | undefined,
  budget: number[] | undefined,
  mi: number,
  formatNok: (n: number) => string = formatNOK,
): { text: string; tone?: 'muted' | 'good' | 'bad' } {
  if (kind === 'actual') {
    return { text: formatNok(actual?.[mi] ?? 0) }
  }
  if (kind === 'budget') {
    return { text: formatNok(budget?.[mi] ?? 0) }
  }
  if (kind === 'variance') {
    const v = monthVariance(actual, budget, mi)
    const tone = varianceTextColorForLine(type, v)
    return { text: formatNok(v), tone }
  }
  return formatVariancePctCell(type, actual, budget, mi)
}

export function formatMatrixSummary(
  kind: ArsvisningRowKey,
  type: 'income' | 'expense',
  actual: number[] | undefined,
  budget: number[] | undefined,
  formatNok: (n: number) => string = formatNOK,
): { sumText: string; avgText: string; sumTone?: 'muted' | 'good' | 'bad'; avgTone?: 'muted' | 'good' | 'bad' } {
  const sumA = sumTwelve(actual)
  const sumB = sumTwelve(budget)
  if (kind === 'actual') {
    return { sumText: formatNok(sumA), avgText: formatNok(sumA / 12) }
  }
  if (kind === 'budget') {
    return { sumText: formatNok(sumB), avgText: formatNok(sumB / 12) }
  }
  if (kind === 'variance') {
    const sv = sumA - sumB
    const tone = varianceTextColorForLine(type, sv)
    return {
      sumText: formatNok(sv),
      avgText: formatNok(sv / 12),
      sumTone: tone,
      avgTone: tone,
    }
  }
  const y = formatVariancePctYearSummary(type, actual, budget)
  return {
    sumText: y.text,
    avgText: formatVariancePctAveragePlaceholder(),
    sumTone: y.tone,
    avgTone: 'muted',
  }
}
