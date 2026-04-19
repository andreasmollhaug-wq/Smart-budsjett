import { describe, expect, it } from 'vitest'
import type { BudgetVsActualRow } from './bankReportData'
import type { BudgetCategory } from './store'
import {
  buildGroupAggregateMonthArrays,
  filterCategoryIdsForArsvisningLineFilter,
  formatMatrixCell,
  formatVariancePctCell,
  formatVariancePctYearSummary,
  parentCategoryToAggregateLineType,
  parseStoredArsvisningLineFilter,
  parseStoredArsvisningRowVisibility,
  varianceTextColorForLine,
} from './budgetYearMatrixHelpers'

function minimalCategory(name: string): BudgetCategory {
  return {
    id: name,
    name,
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    color: '#000',
    parentCategory: 'utgifter',
    frequency: 'monthly',
  }
}

function row(partial: Partial<BudgetVsActualRow> & Pick<BudgetVsActualRow, 'categoryId' | 'type' | 'variance'>): BudgetVsActualRow {
  return {
    name: 'X',
    parentCategory: 'utgifter',
    budgeted: 0,
    actual: 0,
    ...partial,
  }
}

describe('parentCategoryToAggregateLineType', () => {
  it('inntekter gir income', () => {
    expect(parentCategoryToAggregateLineType('inntekter')).toBe('income')
  })

  it('øvrige grupper gir expense', () => {
    expect(parentCategoryToAggregateLineType('regninger')).toBe('expense')
    expect(parentCategoryToAggregateLineType('utgifter')).toBe('expense')
  })
})

describe('buildGroupAggregateMonthArrays', () => {
  it('summerer to linjer per måned', () => {
    const cats = [minimalCategory('A'), minimalCategory('B')]
    const actualMatrix = new Map<string, number[]>([
      ['A', [100, 200, ...Array(10).fill(0)]],
      ['B', [50, 25, ...Array(10).fill(0)]],
    ])
    const budgetMatrix = new Map<string, number[]>([
      ['A', [90, 100, ...Array(10).fill(0)]],
      ['B', [60, 30, ...Array(10).fill(0)]],
    ])
    const { actual, budget } = buildGroupAggregateMonthArrays(cats, actualMatrix, budgetMatrix)
    expect(actual[0]).toBe(150)
    expect(actual[1]).toBe(225)
    expect(budget[0]).toBe(150)
    expect(budget[1]).toBe(130)
  })
})

describe('parseStoredArsvisningRowVisibility', () => {
  it('returnerer null når alt er av', () => {
    const raw = JSON.stringify({ actual: false, budget: false, variance: false, variancePct: false })
    expect(parseStoredArsvisningRowVisibility(raw)).toBeNull()
  })

  it('leser gyldig JSON', () => {
    const raw = JSON.stringify({ actual: true, budget: false, variance: true, variancePct: false })
    expect(parseStoredArsvisningRowVisibility(raw)).toEqual({
      actual: true,
      budget: false,
      variance: true,
      variancePct: false,
    })
  })
})

describe('parseStoredArsvisningLineFilter', () => {
  it('returnerer all for ugyldig eller tom', () => {
    expect(parseStoredArsvisningLineFilter(null)).toBe('all')
    expect(parseStoredArsvisningLineFilter('')).toBe('all')
    expect(parseStoredArsvisningLineFilter('not-json')).toBe('all')
    expect(parseStoredArsvisningLineFilter(JSON.stringify('weird'))).toBe('all')
  })

  it('leser gyldige moduser', () => {
    expect(parseStoredArsvisningLineFilter(JSON.stringify('unfavorable'))).toBe('unfavorable')
    expect(parseStoredArsvisningLineFilter(JSON.stringify('favorable'))).toBe('favorable')
    expect(parseStoredArsvisningLineFilter(JSON.stringify('all'))).toBe('all')
  })
})

describe('filterCategoryIdsForArsvisningLineFilter', () => {
  const rows: BudgetVsActualRow[] = [
    row({ categoryId: 'e-over', type: 'expense', variance: 100 }),
    row({ categoryId: 'e-under', type: 'expense', variance: -50 }),
    row({ categoryId: 'e-zero', type: 'expense', variance: 0 }),
    row({ categoryId: 'i-under', type: 'income', variance: -20 }),
    row({ categoryId: 'i-over', type: 'income', variance: 30 }),
    row({ categoryId: 'i-zero', type: 'income', variance: 0 }),
  ]

  it('all gir null', () => {
    expect(filterCategoryIdsForArsvisningLineFilter(rows, 'all')).toBeNull()
  })

  it('unfavorable: utgift over og inntekt under', () => {
    const s = filterCategoryIdsForArsvisningLineFilter(rows, 'unfavorable')
    expect(s).toEqual(new Set(['e-over', 'i-under']))
  })

  it('favorable: utgift under og inntekt over', () => {
    const s = filterCategoryIdsForArsvisningLineFilter(rows, 'favorable')
    expect(s).toEqual(new Set(['e-under', 'i-over']))
  })

  it('null avvik er ikke med i unfavorable eller favorable', () => {
    const sU = filterCategoryIdsForArsvisningLineFilter(rows, 'unfavorable')
    const sF = filterCategoryIdsForArsvisningLineFilter(rows, 'favorable')
    expect(sU?.has('e-zero')).toBe(false)
    expect(sU?.has('i-zero')).toBe(false)
    expect(sF?.has('e-zero')).toBe(false)
    expect(sF?.has('i-zero')).toBe(false)
  })
})

describe('varianceTextColorForLine', () => {
  it('utgift over budsjett er bad', () => {
    expect(varianceTextColorForLine('expense', 100)).toBe('bad')
  })

  it('utgift under budsjett er good', () => {
    expect(varianceTextColorForLine('expense', -50)).toBe('good')
  })

  it('inntekt under budsjett er bad', () => {
    expect(varianceTextColorForLine('income', -1)).toBe('bad')
  })

  it('inntekt over budsjett er good', () => {
    expect(varianceTextColorForLine('income', 10)).toBe('good')
  })

  it('null avvik er muted', () => {
    expect(varianceTextColorForLine('expense', 0)).toBe('muted')
  })
})

describe('formatVariancePctCell', () => {
  it('gir – når månedlig budsjett er 0', () => {
    const actual = Array(12).fill(0)
    const budget = Array(12).fill(0)
    budget[2] = 0
    actual[2] = 500
    const r = formatVariancePctCell('expense', actual, budget, 2)
    expect(r.text).toBe('–')
    expect(r.tone).toBe('muted')
  })

  it('viser prosent når budsjett finnes', () => {
    const actual = Array(12).fill(0)
    const budget = Array(12).fill(0)
    budget[0] = 1000
    actual[0] = 1200
    const r = formatVariancePctCell('expense', actual, budget, 0)
    expect(r.text).toMatch(/%/)
    expect(r.tone).toBe('bad')
  })
})

describe('formatVariancePctYearSummary', () => {
  it('gir – når årsbudsjett er 0', () => {
    const actual = Array(12).fill(100)
    const budget = Array(12).fill(0)
    const r = formatVariancePctYearSummary('expense', actual, budget)
    expect(r.text).toBe('–')
    expect(r.tone).toBe('muted')
  })
})

describe('formatMatrixCell variance', () => {
  it('matcher avvik mot tone', () => {
    const actual = [...Array(12)].map((_, i) => (i === 0 ? 2000 : 0))
    const budget = [...Array(12)].map((_, i) => (i === 0 ? 1000 : 0))
    const r = formatMatrixCell('variance', 'expense', actual, budget, 0)
    expect(r.text).toContain('1')
    expect(r.tone).toBe('bad')
  })
})
