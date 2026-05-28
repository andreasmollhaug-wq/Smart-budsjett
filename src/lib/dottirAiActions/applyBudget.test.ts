import { beforeEach, describe, expect, it } from 'vitest'
import { applyDottirAiBudgetAction } from '@/lib/dottirAiActions/applyBudget'
import { validateProposedAction, isValidatedBudgetAction } from '@/lib/dottirAiActions/validate'
import { createDefaultPersistedSlice, DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

describe('applyDottirAiBudgetAction', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('creates new Strøm line and sets monthly budget', () => {
    const year = useStore.getState().budgetYear
    const validated = validateProposedAction(createDefaultPersistedSlice(), {
      kind: 'budget',
      categoryName: 'Strøm',
      parentCategory: 'regninger',
      amountNok: 1500,
      period: { mode: 'monthly_all' },
      budgetYear: year,
      createLineIfMissing: true,
    })
    expect(isValidatedBudgetAction(validated)).toBe(true)
    if (!isValidatedBudgetAction(validated)) return

    applyDottirAiBudgetAction(useStore.getState(), validated)

    const cats = useStore.getState().people[DEFAULT_PROFILE_ID]!.budgetCategories
    const strom = cats.find((c) => c.name === 'Strøm')
    expect(strom).toBeDefined()
    expect(strom!.budgeted).toEqual(Array(12).fill(1500))
  })

  it('updates existing line', () => {
    const year = useStore.getState().budgetYear
    useStore.getState().addBudgetCategory({
      id: 'existing-strom',
      name: 'Strøm',
      budgeted: Array(12).fill(1000),
      spent: 0,
      type: 'expense',
      color: '#3B5BDB',
      parentCategory: 'regninger',
      frequency: 'monthly',
    })

    const validated = validateProposedAction(useStore.getState(), {
      kind: 'budget',
      categoryName: 'Strøm',
      parentCategory: 'regninger',
      amountNok: 1500,
      period: { mode: 'monthly_all' },
      budgetYear: year,
    })
    expect(isValidatedBudgetAction(validated)).toBe(true)
    if (!isValidatedBudgetAction(validated)) return

    applyDottirAiBudgetAction(useStore.getState(), validated)
    const strom = useStore.getState().people[DEFAULT_PROFILE_ID]!.budgetCategories.find((c) => c.id === 'existing-strom')
    expect(strom!.budgeted).toEqual(Array(12).fill(1500))
  })
})
