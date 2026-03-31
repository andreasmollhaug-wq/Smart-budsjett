import type { SavingsFrequency } from './types'

/**
 * Returnerer én månedsindeks (0–11) per innbetaling i året, jevnt fordelt.
 * f=1: desember (11). f=12: alle måneder.
 */
export function paymentMonthsInYear(frequency: SavingsFrequency): number[] {
  if (frequency === 1) return [11]
  const months: number[] = []
  for (let i = 0; i < frequency; i++) {
    months.push(Math.min(11, Math.floor((i * 12) / frequency)))
  }
  return months
}

/** True hvis denne kalendermåneden (0–11) har innbetaling. */
export function isSavingsMonth(monthInYear: number, frequency: SavingsFrequency): boolean {
  return paymentMonthsInYear(frequency).includes(monthInYear)
}
