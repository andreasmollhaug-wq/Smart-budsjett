import { describe, expect, it } from 'vitest'
import { periodRange, periodSubtitle } from './budgetPeriod'

describe('budgetPeriod', () => {
  it('periodRange: month er én måned', () => {
    expect(periodRange('month', 3)).toEqual({ start: 3, end: 3 })
  })

  it('periodRange: ytd fra jan til valgt måned', () => {
    expect(periodRange('ytd', 5)).toEqual({ start: 0, end: 5 })
  })

  it('periodRange: year er alle måneder', () => {
    expect(periodRange('year', 0)).toEqual({ start: 0, end: 11 })
  })

  it('periodSubtitle inneholder år', () => {
    expect(periodSubtitle('month', 2026, 0)).toContain('2026')
    expect(periodSubtitle('year', 2025, 6)).toContain('2025')
  })
})
