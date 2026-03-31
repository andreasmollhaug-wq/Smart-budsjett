import type { FormuebyggerInput, SensitivityRow } from './types'
import { simulateFormuebygger } from './simulate'

/** Åtte scenarier (0,5 %-steg), jf. produktspesifikasjon */
const SCENARIO_PCTS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]

/**
 * Sensitivitetstabell: åtte scenarier (0,5 %-steg).
 * Base-raden er nærmeste avkastning til brukerens valgte `baseAnnualReturnPct`.
 */
export function computeSensitivity(
  input: FormuebyggerInputForSensitivity,
  extraByGlobalMonth: number[] | undefined,
): SensitivityRow[] {
  const basePct = input.baseAnnualReturnPct
  const baseResult = simulateFormuebygger(
    { ...input.formueInput, annualReturn: basePct / 100 },
    extraByGlobalMonth,
  )
  const baseFv = baseResult.finalNominal

  const rows = SCENARIO_PCTS.map((pct) => {
    const r = simulateFormuebygger({ ...input.formueInput, annualReturn: pct / 100 }, extraByGlobalMonth)
    const returnKr = r.finalNominal - r.totalDeposits
    return {
      annualReturnPct: pct,
      futureValue: r.finalNominal,
      realValue: r.finalReal,
      returnKr,
      deviationFromBase: r.finalNominal - baseFv,
      isBase: false,
    }
  })

  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < rows.length; i++) {
    const d = Math.abs(rows[i]!.annualReturnPct - basePct)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  rows[bestIdx] = { ...rows[bestIdx]!, isBase: true }

  return rows
}

export interface FormuebyggerInputForSensitivity {
  formueInput: FormuebyggerInput
  /** Base-avkastning i prosent (f.eks. 7 for 7 %) — markeres i tabellen */
  baseAnnualReturnPct: number
}
