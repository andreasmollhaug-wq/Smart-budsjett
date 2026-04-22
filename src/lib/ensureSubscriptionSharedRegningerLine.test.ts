import { describe, expect, it, vi } from 'vitest'
import { createEmptyPersonData, type BudgetCategory } from '@/lib/store'
import {
  AUTO_SELECT_ABONNEMENTER_VALUE,
  AUTO_SELECT_MEDLEMSKAP_VALUE,
  AUTO_SELECT_TV_STREAMING_VALUE,
  desiredNameForAutoSelectValue,
  ensureSubscriptionSharedRegningerLine,
  SUBSCRIPTION_SHARED_AUTO_ABONNEMENT_NAME,
  SUBSCRIPTION_SHARED_AUTO_MEDLEMSKAP_NAME,
  SUBSCRIPTION_SHARED_AUTO_STREAMING_NAME,
} from './ensureSubscriptionSharedRegningerLine'

function mkCat(partial: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    color: '#000',
    parentCategory: 'regninger',
    frequency: 'monthly',
    ...partial,
  }
}

describe('desiredNameForAutoSelectValue', () => {
  it('mapper auto-verdier til ønsket navn', () => {
    expect(desiredNameForAutoSelectValue(AUTO_SELECT_TV_STREAMING_VALUE)).toBe(
      SUBSCRIPTION_SHARED_AUTO_STREAMING_NAME,
    )
    expect(desiredNameForAutoSelectValue(AUTO_SELECT_ABONNEMENTER_VALUE)).toBe(
      SUBSCRIPTION_SHARED_AUTO_ABONNEMENT_NAME,
    )
    expect(desiredNameForAutoSelectValue(AUTO_SELECT_MEDLEMSKAP_VALUE)).toBe(
      SUBSCRIPTION_SHARED_AUTO_MEDLEMSKAP_NAME,
    )
    expect(desiredNameForAutoSelectValue('some-uuid')).toBeUndefined()
  })
})

describe('ensureSubscriptionSharedRegningerLine', () => {
  it('returnerer eksisterende id uten å opprette på nytt', () => {
    const existing = mkCat({ id: 'c-stream', name: 'Streaming' })
    const addCat = vi.fn()
    const addLabel = vi.fn()
    const labels = createEmptyPersonData().customBudgetLabels!
    const id = ensureSubscriptionSharedRegningerLine(
      SUBSCRIPTION_SHARED_AUTO_STREAMING_NAME,
      [existing],
      addCat,
      addLabel,
      labels,
    )
    expect(id).toBe('c-stream')
    expect(addCat).not.toHaveBeenCalled()
  })

  it('oppretter Abonnementer når den mangler', () => {
    const addCat = vi.fn()
    const addLabel = vi.fn()
    const labels = createEmptyPersonData().customBudgetLabels!
    const id = ensureSubscriptionSharedRegningerLine(
      SUBSCRIPTION_SHARED_AUTO_ABONNEMENT_NAME,
      [],
      (c) => addCat(c),
      addLabel,
      labels,
    )
    expect(addCat).toHaveBeenCalledTimes(1)
    const created = addCat.mock.calls[0]![0]!
    expect(created.name).toBe('Abonnementer')
    expect(created.parentCategory).toBe('regninger')
    expect(id).toBe(created.id)
  })

  it('oppretter Medlemskap når den mangler', () => {
    const addCat = vi.fn()
    const addLabel = vi.fn()
    const labels = createEmptyPersonData().customBudgetLabels!
    const id = ensureSubscriptionSharedRegningerLine(
      SUBSCRIPTION_SHARED_AUTO_MEDLEMSKAP_NAME,
      [],
      (c) => addCat(c),
      addLabel,
      labels,
    )
    expect(addCat).toHaveBeenCalledTimes(1)
    const created = addCat.mock.calls[0]![0]!
    expect(created.name).toBe('Medlemskap')
    expect(created.parentCategory).toBe('regninger')
    expect(id).toBe(created.id)
  })

  it('bruker unikt navn når navnet allerede finnes utenfor Regninger', () => {
    const takenUtgift = mkCat({
      id: 'o',
      name: 'Abonnementer',
      parentCategory: 'utgifter',
    })
    const addCat = vi.fn()
    const addLabel = vi.fn()
    const labels = createEmptyPersonData().customBudgetLabels!
    ensureSubscriptionSharedRegningerLine(
      SUBSCRIPTION_SHARED_AUTO_ABONNEMENT_NAME,
      [takenUtgift],
      (c) => addCat(c),
      addLabel,
      labels,
    )
    expect(addCat.mock.calls[0]![0]!.name).toBe('Abonnementer (2)')
  })
})
