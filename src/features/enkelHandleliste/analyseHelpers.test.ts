import { describe, expect, it } from 'vitest'
import { topProductsByCheckCount } from './analyseHelpers'

describe('topProductsByCheckCount', () => {
  it('sorterer på checkCount og filtrerer gamle', () => {
    const now = new Date().toISOString()
    const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
    const top = topProductsByCheckCount({
      a: {
        normalizedKey: 'a',
        displayName: 'A',
        addCount: 1,
        checkCount: 5,
        lastCheckedAt: now,
      },
      b: {
        normalizedKey: 'b',
        displayName: 'B',
        addCount: 1,
        checkCount: 10,
        lastCheckedAt: now,
      },
      c: {
        normalizedKey: 'c',
        displayName: 'C',
        addCount: 1,
        checkCount: 99,
        lastCheckedAt: old,
      },
    })
    expect(top[0]?.displayName).toBe('B')
    expect(top).toHaveLength(2)
  })
})
