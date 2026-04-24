import { describe, it, expect } from 'vitest'
import { willMergeWithExistingLineInParent } from '@/lib/categoryRemapMessages'
import type { BudgetCategory } from '@/lib/store'

function cat(over: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory'>): BudgetCategory {
  return {
    type: 'expense',
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...over,
  } as BudgetCategory
}

describe('willMergeWithExistingLineInParent', () => {
  it('returnerer false når tomt målnavn', () => {
    const list: BudgetCategory[] = [
      cat({ id: 'a', name: 'Strøm', parentCategory: 'regninger' }),
      cat({ id: 'b', name: 'Annet', parentCategory: 'regninger' }),
    ]
    expect(willMergeWithExistingLineInParent(list, 'regninger', 'a', '')).toBe(false)
  })

  it('returnerer false når navnet endres til noe som ikke finnes', () => {
    const list: BudgetCategory[] = [cat({ id: 'a', name: 'Strøm', parentCategory: 'regninger' })]
    expect(willMergeWithExistingLineInParent(list, 'regninger', 'a', 'Ny unik kategori')).toBe(false)
  })

  it('returnerer true når annen rad i samme hovedgruppe allerede har målnavnet', () => {
    const list: BudgetCategory[] = [
      cat({ id: 'a', name: 'Strøm', parentCategory: 'regninger' }),
      cat({ id: 'b', name: 'Vann', parentCategory: 'regninger' }),
    ]
    expect(willMergeWithExistingLineInParent(list, 'regninger', 'a', 'Vann')).toBe(true)
  })

  it('returnerer false når det kun er én rad med målnavnet (samme id utelates)', () => {
    const list: BudgetCategory[] = [cat({ id: 'a', name: 'Strøm', parentCategory: 'regninger' })]
    expect(willMergeWithExistingLineInParent(list, 'regninger', 'a', 'Strøm')).toBe(false)
  })

  it('ser ikke etter duplikater i annen hovedgruppe (merge-kunndeteksjon for samme gruppe)', () => {
    const list: BudgetCategory[] = [
      cat({ id: 'a', name: 'Strøm', parentCategory: 'regninger' }),
      cat({ id: 'b', name: 'Mat', parentCategory: 'utgifter' }),
    ]
    expect(willMergeWithExistingLineInParent(list, 'regninger', 'a', 'Mat')).toBe(false)
  })
})
