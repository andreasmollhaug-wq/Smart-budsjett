import { describe, expect, it } from 'vitest'
import {
  CREDITOR_REGISTRY_DEMO_CREDITORS,
  CREDITOR_REGISTRY_DEMO_OVERVIEW,
} from './demoOverview'

describe('creditorRegistry demoOverview', () => {
  it('har tre kreditorer og realistiske summer', () => {
    expect(CREDITOR_REGISTRY_DEMO_CREDITORS).toHaveLength(3)
    expect(CREDITOR_REGISTRY_DEMO_OVERVIEW.creditorCount).toBe(3)
    expect(CREDITOR_REGISTRY_DEMO_OVERVIEW.loanCount).toBe(5)
    expect(CREDITOR_REGISTRY_DEMO_OVERVIEW.totalRemaining).toBeGreaterThan(3_000_000)
    expect(CREDITOR_REGISTRY_DEMO_OVERVIEW.totalMonthly).toBeGreaterThan(15_000)
  })
})
