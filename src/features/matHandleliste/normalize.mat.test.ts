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
      },
    }
    const s = normalizeMatHandlelisteState(raw)
    expect(s.settings.planVisibleSlots).toEqual(['breakfast', 'dinner'])
    expect(s.settings.planWeekLayout).toBe('grid')
  })

  it('normalizePlanVisibleSlots: tom liste gir alle tidsrom', () => {
    expect(normalizePlanVisibleSlots([])).toEqual([...MEAL_SLOT_ORDER])
  })
})
