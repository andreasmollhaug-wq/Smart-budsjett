import { describe, expect, test } from 'vitest'
import { buildBudgetSetupChecklist } from '@/lib/budgetSetupChecklist'
import type { BudgetCategory } from '@/lib/store'

function cat(input: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>): BudgetCategory {
  return {
    id: input.id,
    name: input.name,
    parentCategory: input.parentCategory,
    type: input.type,
    color: input.color ?? '#000',
    frequency: input.frequency ?? 'monthly',
    budgeted: input.budgeted ?? Array(12).fill(0),
    spent: input.spent ?? 0,
  }
}

describe('buildBudgetSetupChecklist', () => {
  test('strict thresholds: marks missing counts correctly', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({ id: 'i1', name: 'Lønn', parentCategory: 'inntekter', type: 'income', budgeted: Array(12).fill(100) }),
      cat({ id: 'u1', name: 'Mat', parentCategory: 'utgifter', type: 'expense', budgeted: Array(12).fill(100) }),
      cat({ id: 'u2', name: 'Transport', parentCategory: 'utgifter', type: 'expense', budgeted: Array(12).fill(100) }),
    ]

    const items = buildBudgetSetupChecklist({ budgetCategories, budgetYear: 2026, overridesByYear: {} })
    const inn = items.find((x) => x.id === 'inntekter')!
    const utg = items.find((x) => x.id === 'utgifter')!

    expect(inn.done).toBe(true)
    expect(inn.autoDone).toBe(true)
    expect(inn.statusKind).toBe('auto')
    expect(inn.lines.some((l) => l.name === 'Lønn' && l.yearTotal > 0)).toBe(true)

    expect(utg.done).toBe(false)
    expect(utg.autoDone).toBe(false)
    expect(utg.statusKind).toBe('open')
    expect(utg.countWithAmount).toBe(2)
    expect(utg.missing).toBe(6)
    expect(utg.lines).toHaveLength(2)
  })

  test('override makes done true even when autoDone false', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({ id: 'u1', name: 'Mat', parentCategory: 'utgifter', type: 'expense', budgeted: Array(12).fill(100) }),
    ]
    const overridesByYear = { '2026': { utgifter: true } }
    const items = buildBudgetSetupChecklist({ budgetCategories, budgetYear: 2026, overridesByYear })
    const utg = items.find((x) => x.id === 'utgifter')!

    expect(utg.autoDone).toBe(false)
    expect(utg.overriddenDone).toBe(true)
    expect(utg.done).toBe(true)
    expect(utg.statusKind).toBe('override')
  })
})
