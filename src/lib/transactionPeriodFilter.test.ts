import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/store'
import {
  isIsoDateString,
  kpiSubForTransactionPeriod,
  transactionInPeriod,
  transactionOnOrBeforeToday,
  ytdRangeIso,
} from '@/lib/transactionPeriodFilter'

const TODAY = '2026-04-09'

function tx(date: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    date,
    description: 'x',
    amount: 100,
    category: 'Test',
    type: 'expense',
    ...overrides,
  }
}

describe('isIsoDateString', () => {
  it('accepts yyyy-mm-dd', () => {
    expect(isIsoDateString('2026-04-09')).toBe(true)
  })
  it('rejects invalid', () => {
    expect(isIsoDateString('2026-4-9')).toBe(false)
    expect(isIsoDateString('')).toBe(false)
  })
})

describe('ytdRangeIso', () => {
  it('returns jan through today for current year', () => {
    expect(ytdRangeIso(2026, TODAY)).toEqual({ start: '2026-01-01', end: '2026-04-09' })
  })
  it('returns null when entire year is in the future', () => {
    expect(ytdRangeIso(2027, TODAY)).toBeNull()
  })
  it('returns full past year when today is after that year', () => {
    expect(ytdRangeIso(2024, TODAY)).toEqual({ start: '2024-01-01', end: '2024-12-31' })
  })
})

describe('transactionInPeriod', () => {
  const t = (d: string) => tx(d)

  it('ytd includes jan through apr 9 for 2026', () => {
    expect(transactionInPeriod(t('2026-01-15'), 'ytd', 2026, TODAY)).toBe(true)
    expect(transactionInPeriod(t('2026-04-09'), 'ytd', 2026, TODAY)).toBe(true)
  })
  it('ytd excludes may and later in 2026', () => {
    expect(transactionInPeriod(t('2026-05-01'), 'ytd', 2026, TODAY)).toBe(false)
    expect(transactionInPeriod(t('2026-12-31'), 'ytd', 2026, TODAY)).toBe(false)
  })
  it('ytd excludes future day in current month', () => {
    expect(transactionInPeriod(t('2026-04-20'), 'ytd', 2026, TODAY)).toBe(false)
  })
  it('month filters by yyyy-mm prefix', () => {
    expect(transactionInPeriod(t('2026-04-01'), 3, 2026, TODAY)).toBe(true)
    expect(transactionInPeriod(t('2026-03-31'), 3, 2026, TODAY)).toBe(false)
  })
  it('all includes any month in year', () => {
    expect(transactionInPeriod(t('2026-11-01'), 'all', 2026, TODAY)).toBe(true)
  })
})

describe('transactionOnOrBeforeToday', () => {
  it('includes today and past', () => {
    expect(transactionOnOrBeforeToday(tx('2026-04-09'), TODAY)).toBe(true)
    expect(transactionOnOrBeforeToday(tx('2025-12-01'), TODAY)).toBe(true)
  })
  it('excludes future', () => {
    expect(transactionOnOrBeforeToday(tx('2026-05-01'), TODAY)).toBe(false)
  })
})

describe('kpiSubForTransactionPeriod', () => {
  it('forms labels for all, ytd and single month', () => {
    expect(kpiSubForTransactionPeriod(2026, 'all')).toBe('Hele kalenderåret 2026')
    expect(kpiSubForTransactionPeriod(2026, 'ytd')).toBe('Hittil i år 2026')
    expect(kpiSubForTransactionPeriod(2025, 3)).toBe('April 2025')
  })
})
