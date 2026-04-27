import { describe, expect, it } from 'vitest'
import { shoppingListRemainingKpi } from './listKpi'
import type { ShoppingListItem } from './types'

function baseItem(over: Partial<ShoppingListItem>): ShoppingListItem {
  return {
    id: 'x',
    displayName: 'Test',
    normalizedKey: 'test',
    quantity: 2,
    unit: 'stk',
    categoryId: 'annet',
    checked: false,
    sources: [],
    manual: true,
    addedFromProfileId: 'p',
    createdAt: 't',
    updatedAt: 't',
    ...over,
  }
}

describe('shoppingListRemainingKpi', () => {
  it('teller kun ikke-avkrysset og summerer kun med pris', () => {
    const list: ShoppingListItem[] = [
      baseItem({ id: '1', checked: false, unitPriceNok: 10, quantity: 2 }),
      baseItem({ id: '2', checked: false, unitPriceNok: null, quantity: 1 }),
      baseItem({ id: '3', checked: true, unitPriceNok: 99, quantity: 1 }),
    ]
    const k = shoppingListRemainingKpi(list)
    expect(k.remainingCount).toBe(2)
    expect(k.pricedCount).toBe(1)
    expect(k.sumNok).toBe(20)
  })

  it('bruker quantity 1 når null', () => {
    const list: ShoppingListItem[] = [baseItem({ id: '1', quantity: null, unitPriceNok: 5 })]
    expect(shoppingListRemainingKpi(list).sumNok).toBe(5)
  })
})
