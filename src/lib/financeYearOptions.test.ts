import { describe, expect, it } from 'vitest'
import {
  buildFinanceViewYearOptions,
  buildSelectableActiveBudgetYearOptions,
  extractCalendarYearFromIsoDate,
  isSelectableActiveBudgetYear,
} from './financeYearOptions'
import type { Transaction } from './store'

const tx = (date: string): Transaction => ({
  id: '1',
  date,
  description: '',
  amount: 1,
  category: 'x',
  type: 'expense',
})

describe('extractCalendarYearFromIsoDate', () => {
  it('parser yyyy-mm-dd', () => {
    expect(extractCalendarYearFromIsoDate('2025-06-15')).toBe(2025)
  })
  it('returnerer null for ugyldig', () => {
    expect(extractCalendarYearFromIsoDate('')).toBeNull()
    expect(extractCalendarYearFromIsoDate('bad')).toBeNull()
  })
})

describe('buildSelectableActiveBudgetYearOptions', () => {
  it('gir referenceYear ±2 stigende', () => {
    expect(buildSelectableActiveBudgetYearOptions(2026)).toEqual([
      2024, 2025, 2026, 2027, 2028,
    ])
  })
})

describe('isSelectableActiveBudgetYear', () => {
  it('godtar innenfor vindu', () => {
    expect(isSelectableActiveBudgetYear(2024, 2026)).toBe(true)
    expect(isSelectableActiveBudgetYear(2023, 2026)).toBe(false)
  })
})

describe('buildFinanceViewYearOptions', () => {
  it('samler budgetYear og transaksjonsår, nyeste først', () => {
    const opts = buildFinanceViewYearOptions({
      budgetYear: 2026,
      transactions: [tx('2025-06-01')],
      includeCalendarYear: false,
    })
    expect(opts).toContain(2026)
    expect(opts).toContain(2025)
    expect(opts.indexOf(2026)).toBeLessThan(opts.indexOf(2025))
  })

  it('kundecase: 2025-tx med aktivt 2026 uten arkiv', () => {
    const opts = buildFinanceViewYearOptions({
      budgetYear: 2026,
      transactions: [tx('2025-06-15')],
      archivedBudgetsByYear: {},
      includeCalendarYear: false,
    })
    expect(opts).toEqual([2026, 2025])
  })

  it('tomme transaksjoner gir kun budgetYear', () => {
    const opts = buildFinanceViewYearOptions({
      budgetYear: 2026,
      transactions: [],
      includeCalendarYear: false,
    })
    expect(opts).toEqual([2026])
  })

  it('inkluderer arkivår uten txs', () => {
    const opts = buildFinanceViewYearOptions({
      budgetYear: 2026,
      transactions: [],
      archivedBudgetsByYear: { '2024': { p1: [] } },
      includeCalendarYear: false,
    })
    expect(opts).toContain(2024)
  })

  it('ignorerer ugyldig date', () => {
    const opts = buildFinanceViewYearOptions({
      budgetYear: 2026,
      transactions: [tx(''), tx('not-a-date')],
      includeCalendarYear: false,
    })
    expect(opts).toEqual([2026])
  })

  it('beholder selectedViewYear uten txs', () => {
    const opts = buildFinanceViewYearOptions({
      budgetYear: 2026,
      transactions: [],
      selectedViewYear: 2019,
      includeCalendarYear: false,
    })
    expect(opts).toContain(2019)
  })
})
