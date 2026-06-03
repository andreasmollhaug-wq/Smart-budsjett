import { describe, expect, it } from 'vitest'
import {
  isTimestampInRange,
  yesterdayRangeUtcMs,
  zonedDayRangeUtcMs,
} from '@/lib/admin/adminMetricsTime'

describe('adminMetricsTime', () => {
  it('isTimestampInRange er inklusiv start, eksklusiv slutt', () => {
    const { startMs, endMsExclusive } = zonedDayRangeUtcMs(2026, 6, 2)
    expect(isTimestampInRange(new Date(startMs).toISOString(), startMs, endMsExclusive)).toBe(true)
    expect(isTimestampInRange(new Date(endMsExclusive - 1).toISOString(), startMs, endMsExclusive)).toBe(
      true,
    )
    expect(isTimestampInRange(new Date(endMsExclusive).toISOString(), startMs, endMsExclusive)).toBe(
      false,
    )
    expect(isTimestampInRange(null, startMs, endMsExclusive)).toBe(false)
  })

  it('yesterdayRangeUtcMs dekker forrige kalenderdag i Oslo', () => {
    const nowMs = Date.parse('2026-06-03T12:00:00.000Z')
    const { startMs, endMsExclusive } = yesterdayRangeUtcMs(nowMs)
    expect(isTimestampInRange('2026-06-02T08:00:00.000Z', startMs, endMsExclusive)).toBe(true)
    expect(isTimestampInRange('2026-06-03T08:00:00.000Z', startMs, endMsExclusive)).toBe(false)
  })
})
