/** Delte periodetyper og hjelpere for budsjett-dashboard og husholdnings-dashboard. */

export const BUDGET_MONTH_LABELS = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export type PeriodMode = 'month' | 'ytd' | 'year'

export function periodRange(mode: PeriodMode, monthIndex: number): { start: number; end: number } {
  if (mode === 'month') return { start: monthIndex, end: monthIndex }
  if (mode === 'ytd') return { start: 0, end: monthIndex }
  return { start: 0, end: 11 }
}

export function periodSubtitle(mode: PeriodMode, year: number, monthIndex: number): string {
  if (mode === 'month') return `${BUDGET_MONTH_LABELS[monthIndex]} ${year}`
  if (mode === 'ytd') return `Januar–${BUDGET_MONTH_LABELS[monthIndex]} ${year} (hittil i år)`
  return `Hele kalenderåret ${year}`
}

export function periodHelpText(mode: PeriodMode): string {
  if (mode === 'month') return 'Faktiske beløp og budsjett gjelder valgt måned.'
  if (mode === 'ytd')
    return 'Faktiske beløp og budsjett summeres fra januar til og med valgt måned i året.'
  return 'Faktiske beløp og budsjett summeres for alle tolv månedene i året.'
}
