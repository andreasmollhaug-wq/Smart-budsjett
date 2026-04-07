import { describe, expect, it } from 'vitest'
import type { BudgetCategory } from '@/lib/store'
import {
  budgetedArrayForCategoryName,
  budgetedArrayForIncomeCategoryName,
  incomeMonthlyTotalsForCategories,
  sumBudgetedIncomeForCategories,
  sumBudgetedIncomeForMonth,
} from './budgetYearHelpers'

function cat(partial: Partial<BudgetCategory> & Pick<BudgetCategory, 'name'>): BudgetCategory {
  const {
    name,
    budgeted,
    spent,
    parentCategory,
    ...rest
  } = partial
  return {
    id: '1',
    name,
    budgeted: budgeted ?? Array(12).fill(0),
    spent: spent ?? 0,
    type: 'income',
    color: '#000',
    parentCategory: parentCategory ?? 'inntekter',
    frequency: 'monthly',
    ...rest,
  }
}

describe('sumBudgetedIncomeForMonth', () => {
  it('summerer inntekter for gitt måned', () => {
    const list: BudgetCategory[] = [
      cat({ name: 'A', budgeted: Array.from({ length: 12 }, (_, i) => (i === 0 ? 1000 : 0)) }),
      cat({ name: 'B', budgeted: Array.from({ length: 12 }, (_, i) => (i === 0 ? 500 : 0)) }),
    ]
    expect(sumBudgetedIncomeForMonth(list, 0)).toBe(1500)
    expect(sumBudgetedIncomeForMonth(list, 1)).toBe(0)
  })

  it('ser bort fra ikke-inntekt', () => {
    const list: BudgetCategory[] = [
      cat({ name: 'Lønn', parentCategory: 'inntekter', budgeted: Array(12).fill(40_000) }),
      cat({ name: 'Husleie', parentCategory: 'regninger', budgeted: Array(12).fill(10_000) }),
    ]
    expect(sumBudgetedIncomeForMonth(list, 3)).toBe(40_000)
  })
})

describe('sumBudgetedIncomeForCategories', () => {
  it('month: én måned', () => {
    const list: BudgetCategory[] = [cat({ name: 'X', budgeted: [100, ...Array(11).fill(0)] })]
    expect(sumBudgetedIncomeForCategories(list, 'month', 0)).toBe(100)
  })

  it('year: sum alle måneder', () => {
    const list: BudgetCategory[] = [cat({ name: 'X', budgeted: [1000, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })]
    expect(sumBudgetedIncomeForCategories(list, 'year', 0)).toBe(2000)
  })
})

describe('budgetedArrayForCategoryName', () => {
  it('finner linje i valgt gruppe', () => {
    const list: BudgetCategory[] = [
      cat({ name: 'Strøm', parentCategory: 'regninger', budgeted: Array(12).fill(1200) }),
    ]
    expect(budgetedArrayForCategoryName(list, 'regninger', 'Strøm')[0]).toBe(1200)
    expect(budgetedArrayForCategoryName(list, 'utgifter', 'Strøm').every((x) => x === 0)).toBe(true)
  })
})

describe('budgetedArrayForIncomeCategoryName', () => {
  it('returnerer månedlige beløp for navnet', () => {
    const list: BudgetCategory[] = [
      cat({ name: 'Lønn', budgeted: [40_000, 41_000, ...Array(10).fill(0)] }),
    ]
    expect(budgetedArrayForIncomeCategoryName(list, 'Lønn')[0]).toBe(40_000)
    expect(budgetedArrayForIncomeCategoryName(list, 'Lønn')[1]).toBe(41_000)
  })

  it('returnerer nuller uten treff', () => {
    expect(budgetedArrayForIncomeCategoryName([], 'Lønn').every((x) => x === 0)).toBe(true)
  })
})

describe('incomeMonthlyTotalsForCategories', () => {
  it('returnerer 12 månedlige summer', () => {
    const list: BudgetCategory[] = [
      cat({ name: 'A', budgeted: [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
      cat({ name: 'B', budgeted: [10, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
    ]
    expect(incomeMonthlyTotalsForCategories(list)).toEqual([11, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })
})
