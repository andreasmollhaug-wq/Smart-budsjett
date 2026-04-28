import { describe, expect, it } from 'vitest'
import {
  MAX_LINES_PER_SAVED_SHOPPING_LIST,
  applySavedLinesToShoppingList,
  snapshotLinesFromShoppingList,
} from '@/features/matHandleliste/savedShoppingLists'
import type { ShoppingListItem } from '@/features/matHandleliste/types'

function manualItem(partial: Partial<ShoppingListItem>): ShoppingListItem {
  return {
    id: 'a',
    displayName: partial.displayName ?? 'Egg',
    normalizedKey: partial.normalizedKey ?? 'egg',
    quantity: partial.quantity ?? 12,
    unit: partial.unit ?? 'stk',
    categoryId: partial.categoryId ?? 'meieri',
    checked: false,
    sources: [],
    manual: true,
    addedFromProfileId: 'p1',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('savedShoppingLists', () => {
  it('snapshotLinesFromShoppingList caps lines', () => {
    const list: ShoppingListItem[] = []
    for (let i = 0; i < MAX_LINES_PER_SAVED_SHOPPING_LIST + 5; i++) {
      list.push(manualItem({ id: `id-${i}`, displayName: `Vare ${i}`, normalizedKey: `vare-${i}` }))
    }
    const snap = snapshotLinesFromShoppingList(list)
    expect(snap.length).toBe(MAX_LINES_PER_SAVED_SHOPPING_LIST)
  })

  it('applySavedLinesToShoppingList replace clears then adds', () => {
    const existing = [manualItem({ id: 'x', displayName: 'Gammel' })]
    const lines = snapshotLinesFromShoppingList([manualItem({ id: 'y', displayName: 'Ny' })])
    const out = applySavedLinesToShoppingList(existing, lines, 'p1', '2020-01-02T00:00:00.000Z', 'replace')
    expect(out.length).toBe(1)
    expect(out[0]!.displayName).toBe('Ny')
  })

  it('applySavedLinesToShoppingList merge appends', () => {
    const existing = [manualItem({ id: 'x', displayName: 'A' })]
    const lines = snapshotLinesFromShoppingList([manualItem({ id: 'y', displayName: 'B' })])
    const out = applySavedLinesToShoppingList(existing, lines, 'p1', '2020-01-02T00:00:00.000Z', 'merge')
    expect(out.length).toBe(2)
  })
})
