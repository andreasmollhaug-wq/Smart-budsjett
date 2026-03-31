import type { FormuebyggerResult } from './types'
import type { SavingsFrequency } from './types'

/**
 * Første år (1-basert) der summert brutto avkastning i året > sparebeløp × frekvens.
 * null hvis aldri innen simuleringen.
 */
export function computeBreakEvenYear(
  result: FormuebyggerResult,
  savingsPerPayment: number,
  frequency: SavingsFrequency,
): number | null {
  const threshold = savingsPerPayment * frequency
  for (const y of result.years) {
    if (y.annualGrossReturn > threshold) {
      return y.yearIndex + 1
    }
  }
  return null
}
