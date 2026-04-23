import { describe, expect, it, vi } from 'vitest'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import {
  applyDedicatedSparingCategory,
  resolveDedicatedSparingBudgetCategory,
} from './savingsBudgetLink'

const labels = () => emptyLabelLists().customBudgetLabels

function spareExpense(id: string, name: string): BudgetCategory {
  return {
    id,
    name,
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    parentCategory: 'sparing',
    frequency: 'monthly',
    color: '#000',
  }
}

describe('resolveDedicatedSparingBudgetCategory', () => {
  it('returnerer null for tomt navn', () => {
    expect(resolveDedicatedSparingBudgetCategory('  ', [], labels())).toBeNull()
  })

  it('gjenbruker eksisterende Sparing-utgift med samme navn', () => {
    const existing = spareExpense('c-1', 'BSU')
    const res = resolveDedicatedSparingBudgetCategory('BSU', [existing], labels())
    expect(res).toEqual({ kind: 'existing', categoryId: 'c-1' })
  })

  it('matcher ikke Sparing-inntekt som utgiftslinje', () => {
    const income: BudgetCategory = {
      ...spareExpense('i-1', 'BSU'),
      type: 'income',
    }
    const res = resolveDedicatedSparingBudgetCategory('BSU', [income], labels())
    expect(res?.kind).toBe('create')
  })

  it('foreslår ny kategori når ingen treff', () => {
    const res = resolveDedicatedSparingBudgetCategory('Ny konto', [], labels())
    expect(res?.kind).toBe('create')
    if (res?.kind === 'create') {
      expect(res.category.name).toBe('Ny konto')
      expect(res.category.parentCategory).toBe('sparing')
      expect(res.category.type).toBe('expense')
    }
  })
})

describe('applyDedicatedSparingCategory', () => {
  it('kaller addBudgetCategory; ikke addCustomBudgetLabel for standard sparing-etikett', () => {
    const addCustom = vi.fn()
    const addCat = vi.fn()
    const res = applyDedicatedSparingCategory('Krypto', [], labels(), {
      addCustomBudgetLabel: addCustom,
      addBudgetCategory: addCat,
    })
    expect(res).not.toBeNull()
    expect(addCustom).not.toHaveBeenCalled()
    expect(addCat).toHaveBeenCalledTimes(1)
    expect(addCat.mock.calls[0]![0]!.name).toBe('Krypto')
    expect(res!.linkedId).toBe(addCat.mock.calls[0]![0]!.id)
  })

  it('registrerer egendefinert etikett når navnet ikke er standard', () => {
    const addCustom = vi.fn()
    const addCat = vi.fn()
    applyDedicatedSparingCategory('Min egen sparelinje', [], labels(), {
      addCustomBudgetLabel: addCustom,
      addBudgetCategory: addCat,
    })
    expect(addCustom).toHaveBeenCalledWith('sparing', 'Min egen sparelinje')
    expect(addCat).toHaveBeenCalledTimes(1)
  })

  it('gjenbruker eksisterende uten addBudgetCategory', () => {
    const addCustom = vi.fn()
    const addCat = vi.fn()
    const existing = spareExpense('x', 'Ferie')
    const res = applyDedicatedSparingCategory('Ferie', [existing], labels(), {
      addCustomBudgetLabel: addCustom,
      addBudgetCategory: addCat,
    })
    expect(res).toEqual({ linkedId: 'x', categoryNameForBaseline: 'Ferie' })
    expect(addCat).not.toHaveBeenCalled()
    expect(addCustom).not.toHaveBeenCalled()
  })
})
