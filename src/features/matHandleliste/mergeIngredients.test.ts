import { describe, expect, it } from 'vitest'
import {
  appendIngredientsToShoppingList,
  appendManualItemToShoppingList,
  mealIngredientToLines,
  normalizeIngredientKey,
  portionFactorForMeal,
  scaleQuantity,
} from './mergeIngredients'
import type { ListItemSource, ShoppingListItem } from './types'

const src: ListItemSource = { mealId: 'm1', mealTitle: 'Taco' }

describe('normalizeIngredientKey', () => {
  it('lowercases and trims', () => {
    expect(normalizeIngredientKey('  Rød Løk  ')).toBe('rod lok')
  })
})

describe('scaleQuantity', () => {
  it('scales and rounds', () => {
    expect(scaleQuantity(2, 1.5)).toBe(3)
    expect(scaleQuantity(0.5, 2)).toBe(1)
    expect(scaleQuantity(null, 2)).toBe(null)
  })
})

describe('portionFactorForMeal', () => {
  it('computes factor', () => {
    expect(portionFactorForMeal(4, 8)).toBe(2)
    expect(portionFactorForMeal(4, 2)).toBe(0.5)
  })
})

describe('mealIngredientToLines', () => {
  it('applies factor to quantities', () => {
    const lines = mealIngredientToLines(
      [
        {
          id: 'i1',
          name: 'Løk',
          quantity: 2,
          unit: 'stk',
        },
      ],
      2,
      src,
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]!.quantity).toBe(4)
    expect(lines[0]!.normalizedKey).toBe('lok')
  })
})

describe('appendIngredientsToShoppingList', () => {
  it('merges same key and unit when unchecked non-manual', () => {
    const existing: ShoppingListItem[] = [
      {
        id: 'a',
        displayName: 'Løk',
        normalizedKey: 'lok',
        quantity: 1,
        unit: 'stk',
        categoryId: 'gronn',
        checked: false,
        sources: [{ mealId: 'x', mealTitle: 'A' }],
        manual: false,
        addedFromProfileId: 'p',
        createdAt: 't',
        updatedAt: 't',
      },
    ]
    const lines = mealIngredientToLines(
      [{ id: 'i', name: 'Løk', quantity: 2, unit: 'stk' }],
      1,
      { mealId: 'm2', mealTitle: 'B' },
    )
    const next = appendIngredientsToShoppingList(existing, lines, 'p', 't2')
    expect(next).toHaveLength(1)
    expect(next[0]!.quantity).toBe(3)
    expect(next[0]!.sources).toHaveLength(2)
    expect(next[0]!.unitPriceNok).toBe(15)
  })

  it('does not merge with checked items', () => {
    const existing: ShoppingListItem[] = [
      {
        id: 'a',
        displayName: 'Løk',
        normalizedKey: 'lok',
        quantity: 1,
        unit: 'stk',
        categoryId: 'gronn',
        checked: true,
        sources: [],
        manual: false,
        addedFromProfileId: 'p',
        createdAt: 't',
        updatedAt: 't',
      },
    ]
    const lines = mealIngredientToLines([{ id: 'i', name: 'Løk', quantity: 1, unit: 'stk' }], 1, src)
    const next = appendIngredientsToShoppingList(existing, lines, 'p', 't2')
    expect(next).toHaveLength(2)
  })
})

describe('appendManualItemToShoppingList', () => {
  it('stores quantity and unit (e.g. grams)', () => {
    const next = appendManualItemToShoppingList([], 'Mel', 'p1', 'now', 'torr', undefined, undefined, {
      quantity: 500,
      unit: 'g',
    })
    expect(next).toHaveLength(1)
    expect(next[0]!.displayName).toBe('Mel')
    expect(next[0]!.quantity).toBe(500)
    expect(next[0]!.unit).toBe('g')
    expect(next[0]!.manual).toBe(true)
  })
})
