import type { RorleggerFinancialDetail, RorleggerProject } from './types'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export type RorleggerFinancialView =
  | {
      mode: 'full'
      detail: RorleggerFinancialDetail
      /** Engasjert = påløpt + forpliktet (beløp «bundet» mot ramma). */
      engagedNok: number
      /**
       * Gjenstående beløp til disposisjon under godkjent ramme etter engasjert (påløpt + forpliktet).
       * Klampes til [0, approvedBudgetNok]. Kun demonstrasjonsregel.
       */
      remainingUnderFrameNok: number
      /** Prognose sluttkost minus godkjent ramme (negativ = forventet mindre enn ramme). */
      varianceForecastNok: number
      engagedPercentOfFrame: number | null
    }
  | {
      mode: 'simple'
      budgetNok: number
      actualNok: number
      remainingNok: number
      utilizationPercent: number | null
      varianceNok: number
    }

/**
 * Ett sammendragsobjekt for detaljvisning: full økonomi når `financialDetail` finnes,
 * ellers enkel modell fra `budgetNok` / `actualNok`.
 */
export function getFinancialView(project: RorleggerProject): RorleggerFinancialView {
  if (project.financialDetail) {
    const d = project.financialDetail
    const engagedNok = d.accruedOrActualNok + d.committedNok
    const remainingUnderFrameNok = clamp(
      d.approvedBudgetNok - engagedNok,
      0,
      d.approvedBudgetNok,
    )
    const varianceForecastNok = d.forecastAtCompletionNok - d.approvedBudgetNok
    const engagedPercentOfFrame =
      d.approvedBudgetNok > 0 ? (engagedNok / d.approvedBudgetNok) * 100 : null
    return {
      mode: 'full',
      detail: d,
      engagedNok,
      remainingUnderFrameNok,
      varianceForecastNok,
      engagedPercentOfFrame,
    }
  }

  const budgetNok = project.budgetNok
  const actualNok = project.actualNok
  const varianceNok = actualNok - budgetNok
  const remainingNok = Math.max(0, budgetNok - actualNok)
  const utilizationPercent = budgetNok > 0 ? (actualNok / budgetNok) * 100 : null
  return {
    mode: 'simple',
    budgetNok,
    actualNok,
    remainingNok,
    utilizationPercent,
    varianceNok,
  }
}
