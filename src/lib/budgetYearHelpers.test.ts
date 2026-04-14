import { describe, expect, it } from 'vitest'
import type { BudgetCategory } from '@/lib/store'
import {
  budgetedArrayForCategoryName,
  budgetedArrayForIncomeCategoryName,
  incomeMonthlyTotalsForCategories,
  reorderBudgetCategoriesForParent,
  sumBudgetedIncomeForCategories,
  sumBudgetedIncomeForMonth,
} from './budgetYearHelpers'

function cat(partial: Partial<BudgetCategory> & Pick<BudgetCategory, 'name'>): BudgetCategory {
  const {
    name,
    budgeted,
    spent,
    parentCategory,
    id,
    ...rest
  } = partial
  return {
    id: id ?? '1',
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

describe('reorderBudgetCategoriesForParent', () => {
  it('bytter to inntekter som ligger ved siden av hverandre', () => {
    const a = cat({ id: 'a', name: 'A' })
    const b = cat({ id: 'b', name: 'B' })
    const list: BudgetCategory[] = [a, b]
    const down = reorderBudgetCategoriesForParent(list, 'inntekter', 'a', 'down')
    expect(down.map((c) => c.id)).toEqual(['b', 'a'])
    const up = reorderBudgetCategoriesForParent(down, 'inntekter', 'a', 'up')
    expect(up.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('bytter inntekter når annen hovedgruppe ligger imellom', () => {
    const a = cat({ id: 'a', name: 'A', parentCategory: 'inntekter' })
    const mid = cat({
      id: 'm',
      name: 'Husleie',
      parentCategory: 'regninger',
      type: 'expense',
    })
    const c = cat({ id: 'c', name: 'C', parentCategory: 'inntekter' })
    const list: BudgetCategory[] = [a, mid, c]
    const next = reorderBudgetCategoriesForParent(list, 'inntekter', 'a', 'down')
    expect(next.map((c) => c.id)).toEqual(['c', 'm', 'a'])
  })

  it('ingen endring ved ukjent id', () => {
    const list: BudgetCategory[] = [cat({ id: 'x', name: 'X' })]
    const out = reorderBudgetCategoriesForParent(list, 'inntekter', 'nosuch', 'down')
    expect(out).toBe(list)
  })

  it('ingen endring ved opp på første eller ned på siste i gruppen', () => {
    const a = cat({ id: 'a', name: 'A' })
    const b = cat({ id: 'b', name: 'B' })
    const list: BudgetCategory[] = [a, b]
    expect(reorderBudgetCategoriesForParent(list, 'inntekter', 'a', 'up')).toBe(list)
    expect(reorderBudgetCategoriesForParent(list, 'inntekter', 'b', 'down')).toBe(list)
  })
})
