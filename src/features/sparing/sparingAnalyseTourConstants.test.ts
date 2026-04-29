import { describe, expect, it } from 'vitest'
import {
  buildSparingAnalyseTourSteps,
  countAnalyseTourSteps,
} from '@/features/sparing/sparingAnalyseTourConstants'

describe('sparingAnalyseTourSteps', () => {
  it('count matcher lengden på bygget step-array', () => {
    const combos = [
      { hasGoals: false, showHouseholdChart: false },
      { hasGoals: false, showHouseholdChart: true },
      { hasGoals: true, showHouseholdChart: false },
      { hasGoals: true, showHouseholdChart: true },
    ] as const
    for (const opts of combos) {
      expect(buildSparingAnalyseTourSteps(opts).length).toBe(countAnalyseTourSteps(opts))
    }
  })

  it('tom utvalg: fem steg (ingen KPI-/diagram-seksjoner)', () => {
    expect(countAnalyseTourSteps({ hasGoals: false, showHouseholdChart: false })).toBe(5)
  })

  it('med mål og uten husholdningsdiagram: ni steg', () => {
    expect(countAnalyseTourSteps({ hasGoals: true, showHouseholdChart: false })).toBe(9)
  })

  it('med mål og husholdningsdiagram: ti steg', () => {
    expect(countAnalyseTourSteps({ hasGoals: true, showHouseholdChart: true })).toBe(10)
  })
})
