import { describe, expect, it } from 'vitest'
import { estimatedShoppingListLineTotalNok } from './estimateShoppingListPrice'
import type { ShoppingListItem } from './types'

function minimalItem(over: Partial<ShoppingListItem>): ShoppingListItem {
  return {
    id: 'id',
    displayName: 'X',
    normalizedKey: 'x',
    quantity: 1,
    unit: 'stk',
    categoryId: 'annet',
    checked: false,
    sources: [],
    manual: false,
    addedFromProfileId: 'p',
    createdAt: 't',
    updatedAt: 't',
    ...over,
  }
}

describe('estimatedShoppingListLineTotalNok', () => {
  it('omregner gram med katalog pr kg (demo brokkoli 300 g)', () => {
    const it = minimalItem({
      unit: 'g',
      quantity: 300,
      unitPriceNok: 38,
    })
    expect(estimatedShoppingListLineTotalNok(it)).toBe(11)
  })

  it('kg multipliseres direkte med pris per kg', () => {
    expect(
      estimatedShoppingListLineTotalNok(
        minimalItem({ unit: 'kg', quantity: 0.5, unitPriceNok: 89 }),
      ),
    ).toBe(45)
  })

  it('melk i dl mot pris per liter i katalog', () => {
    expect(
      estimatedShoppingListLineTotalNok(
        minimalItem({ unit: 'dl', quantity: 4, unitPriceNok: 22 }),
      ),
    ).toBe(9)
  })

  it('stk: mengde × katalog om enhetspris er per stykk', () => {
    expect(
      estimatedShoppingListLineTotalNok(
        minimalItem({ unit: 'stk', quantity: 2, unitPriceNok: 10 }),
      ),
    ).toBe(20)
  })
})
