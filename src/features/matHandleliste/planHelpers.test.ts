import { describe, expect, it } from 'vitest'
import {
  buildWeekPlanExportRows,
  formatDateKeyNb,
  formatWeekRangeLabelNb,
  isoWeekAndYearFromMonday,
  mealVisibleInSlot,
  monthDateRangeKeys,
  summarizeLinesForDialog,
  summarizeWeekPlan,
  weekPlanToCsvString,
} from './planHelpers'
import { MEAL_SLOT_ORDER, type Meal } from './types'

function baseMeal(partial: Partial<Meal> & Pick<Meal, 'id' | 'title'>): Meal {
  return {
    defaultServings: 2,
    ingredients: [],
    createdByProfileId: 'p1',
    createdAt: 't',
    updatedAt: 't',
    ...partial,
  }
}

describe('mealVisibleInSlot', () => {
  it('uten tags: synlig i alle slots', () => {
    const m = baseMeal({ id: '1', title: 'A' })
    expect(mealVisibleInSlot(m, 'breakfast')).toBe(true)
    expect(mealVisibleInSlot(m, 'snack')).toBe(true)
  })
  it('med tags: kun valgte slots', () => {
    const m = baseMeal({ id: '1', title: 'A', tags: ['breakfast', 'lunch'] })
    expect(mealVisibleInSlot(m, 'breakfast')).toBe(true)
    expect(mealVisibleInSlot(m, 'dinner')).toBe(false)
  })
})

describe('planHelpers', () => {
  it('monthDateRangeKeys covers full calendar month', () => {
    const keys = monthDateRangeKeys(2026, 1)
    expect(keys[0]).toBe('2026-02-01')
    expect(keys[keys.length - 1]).toBe('2026-02-28')
    expect(keys.length).toBe(28)
  })

  it('summarizeLinesForDialog dedupes by normalizedKey', () => {
    const src = { mealId: 'm1', mealTitle: 'T' }
    const r = summarizeLinesForDialog([
      { normalizedKey: 'a', displayName: 'A', quantity: 1, unit: 'stk', source: src },
      { normalizedKey: 'a', displayName: 'A2', quantity: 2, unit: 'stk', source: src },
      { normalizedKey: 'b', displayName: 'B', quantity: null, unit: 'stk', source: src },
    ])
    expect(r).toEqual([
      { normalizedKey: 'a', displayName: 'A' },
      { normalizedKey: 'b', displayName: 'B' },
    ])
  })

  it('summarizeWeekPlan: tom uke', () => {
    const keys = ['2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03']
    const s = summarizeWeekPlan(keys, {})
    expect(s.plannedMealCount).toBe(0)
    expect(s.daysWithPlan).toBe(0)
    expect(s.filledSlots).toBe(0)
    expect(s.totalSlots).toBe(35)
    expect(s.bySlot.breakfast).toBe(0)
    expect(s.bySlot.snack).toBe(0)
  })

  it('summarizeWeekPlan: delvis utfylt uke', () => {
    const keys = ['2026-04-27', '2026-04-28']
    const s = summarizeWeekPlan(keys, {
      '2026-04-27': { slots: { breakfast: { mealId: 'a', servings: null }, dinner: { mealId: 'b', servings: 2 } } },
      '2026-04-28': { slots: {} },
    })
    expect(s.plannedMealCount).toBe(2)
    expect(s.daysWithPlan).toBe(1)
    expect(s.filledSlots).toBe(2)
    expect(s.totalSlots).toBe(10)
    expect(s.bySlot.breakfast).toBe(1)
    expect(s.bySlot.dinner).toBe(1)
    expect(s.bySlot.lunch).toBe(0)
  })

  it('summarizeWeekPlan: kun aktive slots teller med', () => {
    const keys = ['2026-04-27', '2026-04-28']
    const active = ['breakfast', 'lunch'] as const
    const s = summarizeWeekPlan(
      keys,
      {
        '2026-04-27': {
          slots: {
            breakfast: { mealId: 'a', servings: null },
            dinner: { mealId: 'ignored', servings: null },
          },
        },
      },
      [...active],
    )
    expect(s.plannedMealCount).toBe(1)
    expect(s.totalSlots).toBe(4)
    expect(s.bySlot.dinner).toBe(0)
    expect(s.bySlot.breakfast).toBe(1)
  })

  it('summarizeWeekPlan: tom activeSlots faller tilbake til MEAL_SLOT_ORDER', () => {
    const keys = ['2026-04-27']
    const s = summarizeWeekPlan(keys, {}, [])
    expect(s.totalSlots).toBe(MEAL_SLOT_ORDER.length)
  })

  it('formatDateKeyNb: norsk rekkefølge', () => {
    expect(formatDateKeyNb('2026-04-27')).toBe('27.04.2026')
  })

  it('isoWeekAndYearFromMonday: kjent mandag april 2026', () => {
    const mon = new Date(2026, 3, 27)
    expect(mon.getDay()).toBe(1)
    const { week, isoYear } = isoWeekAndYearFromMonday(mon)
    expect(isoYear).toBe(2026)
    expect(week).toBe(17)
  })

  it('formatWeekRangeLabelNb inneholder uke og norske datoer', () => {
    const mon = new Date(2026, 3, 27)
    const s = formatWeekRangeLabelNb(mon)
    expect(s).toMatch(/Uke 17 \(2026\)/)
    expect(s).toContain('27.04.2026')
    expect(s).toContain('03.05.2026')
  })

  it('formatWeekRangeLabelNb samme måned: kompakt rekkevidde', () => {
    const mon = new Date(2026, 0, 5)
    expect(mon.getDay()).toBe(1)
    const s = formatWeekRangeLabelNb(mon)
    expect(s).toMatch(/Uke \d+ \(2026\)/)
    expect(s).toContain('januar')
    expect(s).toMatch(/\d+\.–\d+\./)
  })

  it('buildWeekPlanExportRows og CSV', () => {
    const meal = baseMeal({ id: 'm1', title: 'Pasta', defaultServings: 4 })
    const mealMap = new Map([[meal.id, meal]])
    const rows = buildWeekPlanExportRows(
      ['2026-04-27'],
      { '2026-04-27': { slots: { dinner: { mealId: 'm1', servings: 2 } } } },
      ['dinner'],
      mealMap,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]![0]).toBe('27.04.2026')
    expect(rows[0]![2]).toBe('Middag')
    expect(rows[0]![3]).toBe('Pasta')
    expect(rows[0]![4]).toBe('2')
    const csv = weekPlanToCsvString(rows)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Dato;Ukedag;Tidsrom;Måltid;Porsjoner')
    expect(csv).toContain('27.04.2026')
  })
})
