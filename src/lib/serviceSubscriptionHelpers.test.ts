import { describe, expect, it } from 'vitest'
import {
  budgetedTwelveFromMonthly,
  monthlyEquivalentNok,
  uniqueRegningerName,
  yearlyEquivalentNok,
} from './serviceSubscriptionHelpers'

describe('serviceSubscriptionHelpers', () => {
  it('monthlyEquivalentNok', () => {
    expect(monthlyEquivalentNok({ amountNok: 1200, billing: 'monthly' })).toBe(1200)
    expect(monthlyEquivalentNok({ amountNok: 1200, billing: 'yearly' })).toBe(100)
  })

  it('yearlyEquivalentNok', () => {
    expect(yearlyEquivalentNok({ amountNok: 100, billing: 'monthly' })).toBe(1200)
    expect(yearlyEquivalentNok({ amountNok: 1200, billing: 'yearly' })).toBe(1200)
  })

  it('uniqueRegningerName', () => {
    expect(uniqueRegningerName('Netflix', [])).toBe('Netflix')
    expect(uniqueRegningerName('Netflix', ['Netflix'])).toBe('Netflix (2)')
    expect(uniqueRegningerName('Netflix', ['Netflix', 'Netflix (2)'])).toBe('Netflix (3)')
  })

  it('budgetedTwelveFromMonthly', () => {
    expect(budgetedTwelveFromMonthly(100)).toEqual(Array(12).fill(100))
  })
})
