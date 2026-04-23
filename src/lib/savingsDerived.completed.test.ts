import { describe, expect, it } from 'vitest'
import { isSavingsGoalCompleted } from './savingsDerived'

describe('isSavingsGoalCompleted', () => {
  it('false når målbeløp er 0', () => {
    expect(isSavingsGoalCompleted(10_000, 0)).toBe(false)
  })

  it('true når effektiv sparing når målet', () => {
    expect(isSavingsGoalCompleted(10_000, 10_000)).toBe(true)
    expect(isSavingsGoalCompleted(12_000, 10_000)).toBe(true)
  })

  it('false når ennå ikke nådd', () => {
    expect(isSavingsGoalCompleted(9_999, 10_000)).toBe(false)
  })
})
