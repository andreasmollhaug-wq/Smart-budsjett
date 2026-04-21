import { describe, expect, it } from 'vitest'
import {
  aggregateHouseholdData,
  createEmptyPersonData,
  type BudgetCategory,
  type PersonData,
} from './store'

function incomeLine(
  name: string,
  monthlyGross: number,
  percent: number,
): BudgetCategory {
  return {
    id: `cat-${name}`,
    name,
    budgeted: Array(12).fill(monthlyGross),
    spent: 0,
    type: 'income',
    color: '#0CA678',
    parentCategory: 'inntekter',
    frequency: 'monthly',
    incomeWithholding: { apply: true, percent },
  }
}

describe('aggregateHouseholdData inntekt med trekk', () => {
  it('summerer effektiv netto per måned når to profiler har samme linjenavn og ulike trekk', () => {
    const a: PersonData = {
      ...createEmptyPersonData(),
      budgetCategories: [incomeLine('Lønn', 100_000, 20)],
    }
    const b: PersonData = {
      ...createEmptyPersonData(),
      budgetCategories: [incomeLine('Lønn', 100_000, 40)],
    }
    const agg = aggregateHouseholdData({ p1: a, p2: b }, ['p1', 'p2'], 2026)
    const row = agg.budgetCategories.find((c) => c.name === 'Lønn' && c.type === 'income')
    expect(row).toBeDefined()
    expect(row!.incomeWithholding).toBeUndefined()
    const exp = 80_000 + 60_000
    expect(row!.budgeted.every((v) => v === exp)).toBe(true)
  })
})
