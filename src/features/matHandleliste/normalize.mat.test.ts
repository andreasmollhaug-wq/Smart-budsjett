import { describe, expect, it } from 'vitest'
import { normalizeMatHandlelisteState, normalizePlanVisibleSlots } from './normalize'
import { MEAL_SLOT_ORDER, type MatHandlelisteState } from './types'

describe('normalizeMatHandlelisteState mat-migrering', () => {
  it('flytter legacy snack i plan til evening', () => {
    const raw: Partial<MatHandlelisteState> = {
      planByDate: {
        '2026-04-27': {
          slots: {
            snack: { mealId: 'm1', servings: 2 },
            breakfast: { mealId: 'm2', servings: null },
          },
        },
      },
    }
    const s = normalizeMatHandlelisteState(raw)
    const day = s.planByDate['2026-04-27']!
    expect(day.slots.snack).toBeUndefined()
    expect(day.slots.evening).toEqual({ mealId: 'm1', servings: 2 })
    expect(day.slots.breakfast).toEqual({ mealId: 'm2', servings: null })
  })

  it('beholder evening og dropper snack når begge finnes i rå data', () => {
    const raw: Partial<MatHandlelisteState> = {
      planByDate: {
        '2026-04-27': {
          slots: {
            snack: { mealId: 'old', servings: null },
            evening: { mealId: 'new', servings: 3 },
          },
        },
      },
    }
    const s = normalizeMatHandlelisteState(raw)
    const day = s.planByDate['2026-04-27']!
    expect(day.slots.evening).toEqual({ mealId: 'new', servings: 3 })
    expect(day.slots.snack).toBeUndefined()
  })

  it('legger til createdByProfileId default på måltid uten felt', () => {
    const raw: Partial<MatHandlelisteState> = {
      meals: [
        {
          id: 'x',
          title: 'Taco',
          defaultServings: 4,
          ingredients: [],
          createdAt: 't',
          updatedAt: 't',
        } as unknown as MatHandlelisteState['meals'][number],
      ],
    }
    const s = normalizeMatHandlelisteState(raw)
    expect(s.meals[0]!.createdByProfileId).toBe('default')
  })

  it('normaliserer måltid-tags', () => {
    const raw: Partial<MatHandlelisteState> = {
      meals: [
        {
          id: 'x',
          title: 'A',
          defaultServings: 2,
          ingredients: [],
          createdByProfileId: 'p',
          createdAt: 't',
          updatedAt: 't',
          tags: ['breakfast', 'breakfast', 'invalid', 'dinner'] as unknown as MatHandlelisteState['meals'][number]['tags'],
        },
      ],
    }
    const s = normalizeMatHandlelisteState(raw)
    expect(s.meals[0]!.tags).toEqual(['breakfast', 'dinner'])
  })

  it('settings uten plan-felt får default synlige slots og auto layout', () => {
    const s = normalizeMatHandlelisteState({ settings: { groceryBudgetCategoryName: null } })
    expect(s.settings.planVisibleSlots).toEqual([...MEAL_SLOT_ORDER])
    expect(s.settings.planWeekLayout).toBe('auto')
  })

  it('planVisibleSlots filtrerer ugyldige og sorterer', () => {
    const raw: Partial<MatHandlelisteState> = {
      settings: {
        groceryBudgetCategoryName: null,
        planVisibleSlots: ['dinner', 'bogus', 'breakfast'] as unknown as MatHandlelisteState['settings']['planVisibleSlots'],
        planWeekLayout: 'grid',
        shoppingListPdfTemplates: [],
        shoppingListPdfLastTemplateId: null,
      },
    }
    const s = normalizeMatHandlelisteState(raw)
    expect(s.settings.planVisibleSlots).toEqual(['breakfast', 'dinner'])
    expect(s.settings.planWeekLayout).toBe('grid')
  })

  it('normalizePlanVisibleSlots: tom liste gir alle tidsrom', () => {
    expect(normalizePlanVisibleSlots([])).toEqual([...MEAL_SLOT_ORDER])
  })

  it('shoppingListPdfTemplates: klemmer antall og duplikate id-er', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `t${i}`,
      name: `Mal ${i}`,
      createdAt: '2026-01-01T00:00:00.000Z',
      options: {
        showBrand: false,
        showDisclaimer: true,
        showPrintDate: true,
        showPriceColumns: true,
        showCheckboxColumn: true,
        showLineCountFooter: true,
        showEstimatedSumFooter: true,
      },
    }))
    const s = normalizeMatHandlelisteState({
      settings: {
        groceryBudgetCategoryName: null,
        shoppingListPdfTemplates: many,
        shoppingListPdfLastTemplateId: 't14',
      },
    })
    expect(s.settings.shoppingListPdfTemplates.length).toBe(15)
    expect(s.settings.shoppingListPdfTemplates[14]!.id).toBe('t14')
    expect(s.settings.shoppingListPdfLastTemplateId).toBe('t14')
    const dup = normalizeMatHandlelisteState({
      settings: {
        groceryBudgetCategoryName: null,
        shoppingListPdfTemplates: [
          { id: 'x', name: 'A', createdAt: 't', options: many[0]!.options },
          { id: 'x', name: 'B', createdAt: 't', options: many[1]!.options },
        ],
        shoppingListPdfLastTemplateId: 'x',
      },
    })
    expect(dup.settings.shoppingListPdfTemplates.length).toBe(1)
  })

  it('savedShoppingLists: normaliserer linjer og knebler antall lister', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      id: `s${i}`,
      name: `L${i}`,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      lines: [{ displayName: 'Melk', normalizedKey: 'melk', quantity: 1, unit: 'l' as const, categoryId: 'meieri' }],
    }))
    const s = normalizeMatHandlelisteState({ savedShoppingLists: many })
    expect(s.savedShoppingLists.length).toBe(20)
    expect(s.savedShoppingLists[0]!.lines[0]!.displayName).toBe('Melk')
    const dup = normalizeMatHandlelisteState({
      savedShoppingLists: [
        {
          id: 'x',
          name: 'A',
          createdAt: 't',
          updatedAt: 't',
          lines: [],
        },
        {
          id: 'x',
          name: 'B',
          createdAt: 't',
          updatedAt: 't',
          lines: [],
        },
      ],
    })
    expect(dup.savedShoppingLists.length).toBe(1)
    expect(dup.savedShoppingLists[0]!.name).toBe('A')
  })
})
