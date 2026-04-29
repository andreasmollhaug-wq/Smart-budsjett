import { describe, expect, it } from 'vitest'
import {
  buildIngredientSectionLookup,
  mergeDraftIngredientsIntoLookup,
  suggestIngredientSection,
} from './ingredientSectionHints'
import { normalizeIngredientKey } from './ingredientKey'
import type { Meal, MealIngredient, ShoppingListItem } from './types'

function meal(
  id: string,
  updatedAt: string,
  ingredients: { name: string; section?: string }[],
): Meal {
  return {
    id,
    title: 'T',
    defaultServings: 2,
    ingredients: ingredients.map((x, i) => ({
      id: `${id}-i${i}`,
      name: x.name,
      quantity: 1,
      unit: 'stk' as const,
      ...(x.section !== undefined ? { section: x.section } : {}),
    })),
    createdByProfileId: 'p1',
    createdAt: updatedAt,
    updatedAt,
  }
}

function listItem(
  displayName: string,
  categoryId: string,
  overrides: Partial<ShoppingListItem> = {},
): ShoppingListItem {
  return {
    id: 'li-1',
    displayName,
    normalizedKey: displayName.toLowerCase(),
    quantity: 1,
    unit: 'stk',
    categoryId,
    checked: false,
    sources: [],
    manual: true,
    addedFromProfileId: 'p1',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

describe('buildIngredientSectionLookup', () => {
  it('velger seksjon fra sist oppdaterte måltid ved samme ingrediensnavn', () => {
    const newer = meal('m-new', '2026-02-02T12:00:00Z', [
      { name: 'paprika', section: 'Grønt og frukt' },
    ])
    const older = meal('m-old', '2026-01-01T12:00:00Z', [
      { name: 'paprika', section: 'Kun arkiv-seksjon' },
    ])
    const lookup = buildIngredientSectionLookup([older, newer])
    expect(lookup[normalizeIngredientKey('paprika')]).toBe('Grønt og frukt')
  })

  it('fyller manglende nøkler fra handleliste (kategori-label)', () => {
    const lookup = buildIngredientSectionLookup([], [listItem('Min røykte laks', 'kjott')])
    expect(lookup[normalizeIngredientKey('Min røykte laks')]).toBe('Kjøtt og fisk')
  })

  it('måltid overstyrer ikke liste: måltidsseksjon settes først', () => {
    const lookup = buildIngredientSectionLookup(
      [meal('m', '2026-01-02', [{ name: 'Laks', section: 'Egen etikett' }])],
      [listItem('Laks', 'torr')],
    )
    expect(lookup[normalizeIngredientKey('Laks')]).toBe('Egen etikett')
  })

  it('excludeMealId fjerner aktuelt måltid fra måltids-historikk (handleliste beholdes)', () => {
    const lookup = buildIngredientSectionLookup(
      [
        meal('edited', '2026-02-03', [{ name: 'Paprika', section: 'Kun meg' }]),
        meal('other', '2026-02-02', [{ name: 'Egg', section: 'Meieri' }]),
      ],
      [listItem('Paprika', 'gronn')],
      { excludeMealId: 'edited' },
    )
    expect(lookup[normalizeIngredientKey('Paprika')]).toBe('Grønt og frukt')
    expect(lookup[normalizeIngredientKey('Egg')]).toBe('Meieri')
  })
})

function draftIng(id: string, name: string, section?: string): MealIngredient {
  return {
    id,
    name,
    quantity: 1,
    unit: 'stk',
    ...(section !== undefined ? { section } : {}),
  }
}

describe('mergeDraftIngredientsIntoLookup', () => {
  it('utkast med seksjon overskriver base for samme vare', () => {
    const base = buildIngredientSectionLookup([meal('m', '2026-01-01', [{ name: 'Laks', section: 'Kjøtt og fisk' }])])
    const merged = mergeDraftIngredientsIntoLookup(base, [draftIng('a', 'Laks', 'Fiskedisk')])
    expect(merged[normalizeIngredientKey('Laks')]).toBe('Fiskedisk')
  })

  it('siste rad med samme navn vinner', () => {
    const merged = mergeDraftIngredientsIntoLookup(
      {},
      [draftIng('1', 'Laks', 'A'), draftIng('2', 'Laks', 'B')],
    )
    expect(merged[normalizeIngredientKey('Laks')]).toBe('B')
  })
})

describe('suggestIngredientSection', () => {
  it('returnerer innebygd kategori ved tomt lookup (paprika)', () => {
    expect(suggestIngredientSection('paprika', {})).toBe('Grønt og frukt')
  })

  it('returnerer ikke «Annet» for ukjent navn uten lookup', () => {
    expect(suggestIngredientSection('xyz-unknown-ingredient-qwerty', {})).toBeUndefined()
  })

  it('returnerer tom streng eller bare whitespace som undefined', () => {
    expect(suggestIngredientSection('', {})).toBeUndefined()
    expect(suggestIngredientSection('   ', {})).toBeUndefined()
  })

  it('bruker lookup når tilgjengelig', () => {
    const k = normalizeIngredientKey('paprika')
    expect(suggestIngredientSection('paprika', { [k]: 'Min husstandard' })).toBe('Min husstandard')
  })
})
