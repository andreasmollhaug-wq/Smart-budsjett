import { describe, expect, it } from 'vitest'
import { BUDGET_LINE_LABEL_SUGGESTIONS, datalistOptionsForBudgetLines } from './budgetLineSuggestions'

describe('datalistOptionsForBudgetLines', () => {
  it('inneholder forslag og nye etiketter uten duplikater (case-insensitive)', () => {
    const o = datalistOptionsForBudgetLines(['Rørlegger', 'Rørlegger Petter', 'rørlegger'])
    expect(o).toContain('Rørlegger')
    expect(o).toContain('Rørlegger Petter')
    const lower = o.map((x) => x.toLowerCase())
    expect(new Set(lower).size).toBe(lower.length)
  })

  it('standardforslag er ikke tomme', () => {
    expect(BUDGET_LINE_LABEL_SUGGESTIONS.length).toBeGreaterThan(0)
  })
})
