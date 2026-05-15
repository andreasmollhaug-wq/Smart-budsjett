import { describe, expect, it } from 'vitest'
import { exclusiveEndOfOsloYmdAsUnixSeconds } from './osloZonedTime'

describe('exclusiveEndOfOsloYmdAsUnixSeconds', () => {
  it('2026-06-30 Oslo → første øyeblikk av 2026-07-01 (CEST)', () => {
    const sec = exclusiveEndOfOsloYmdAsUnixSeconds('2026-06-30')
    expect(sec).not.toBeNull()
    // 1. juli 2026 kl. 00:00 i Oslo (UTC+2)
    expect(sec).toBe(Math.floor(new Date('2026-06-30T22:00:00.000Z').getTime() / 1000))
  })

  it('avviser ugyldig format', () => {
    expect(exclusiveEndOfOsloYmdAsUnixSeconds('30.06.2026')).toBeNull()
    expect(exclusiveEndOfOsloYmdAsUnixSeconds('')).toBeNull()
  })
})
