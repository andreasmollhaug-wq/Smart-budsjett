import { describe, expect, it } from 'vitest'
import { simulateFormuebygger } from './simulate'
import type { FormuebyggerInput } from './types'

const baseInput = (): FormuebyggerInput => ({
  startAmount: 100_000,
  annualReturn: 0.07,
  savingsPerPayment: 0,
  savingsFrequency: 12,
  years: 1,
  taxRate: 0,
  inflation: 0,
  compoundFrequency: 12,
})

describe('simulateFormuebygger', () => {
  it('12 måneder uten sparing, ingen skatt: UB ved slutt matcher (1+r_å) * start', () => {
    const r = simulateFormuebygger(baseInput(), undefined)
    expect(r.months).toHaveLength(12)
    const expected = 100_000 * 1.07
    expect(r.finalNominal).toBeCloseTo(expected, 6)
  })

  it('månedlig sparing uten skatt: summen av innskudd + avkastning stemmer med sluttformue', () => {
    const input: FormuebyggerInput = {
      ...baseInput(),
      startAmount: 0,
      savingsPerPayment: 1000,
      savingsFrequency: 12,
      years: 1,
      taxRate: 0,
      annualReturn: 0,
    }
    const r = simulateFormuebygger(input, undefined)
    expect(r.totalPeriodicSavings).toBe(12_000)
    expect(r.finalNominal).toBeCloseTo(12_000, 6)
  })

  it('ekstra innskudd i måned 5 øker sluttformue', () => {
    const extra = Array(12).fill(0)
    extra[5] = 50_000
    const r = simulateFormuebygger(baseInput(), extra)
    const rNo = simulateFormuebygger(baseInput(), undefined)
    expect(r.finalNominal).toBeGreaterThan(rNo.finalNominal)
    expect(r.totalExtraDeposits).toBe(50_000)
  })

  it('månedlig skatt reduserer sluttformue vs. ingen skatt', () => {
    const rTax = simulateFormuebygger({ ...baseInput(), taxRate: 0.22 }, undefined)
    const rNo = simulateFormuebygger({ ...baseInput(), taxRate: 0 }, undefined)
    expect(rTax.finalNominal).toBeLessThan(rNo.finalNominal)
  })
})
