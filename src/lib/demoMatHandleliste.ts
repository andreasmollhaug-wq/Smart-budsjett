import { lookupClassicByNormalizedKey } from '@/features/matHandleliste/classicGroceries'
import { normalizeIngredientKey } from '@/features/matHandleliste/ingredientKey'
import { normalizeMatHandlelisteState } from '@/features/matHandleliste/normalize'
import { addDays, dateKeyFromDate, startOfWeekMonday } from '@/features/matHandleliste/planHelpers'
import {
  MEAL_SLOT_ORDER,
  type DayPlan,
  type ListItemSource,
  type MatActivityEvent,
  type MatHandlelisteState,
  type Meal,
  type MealIngredient,
  type MealSlotId,
  type ShoppingListItem,
} from '@/features/matHandleliste/types'

const DEMO_TS = '2026-01-15T10:00:00.000Z'

function ing(
  id: string,
  name: string,
  quantity: number | null,
  unit: MealIngredient['unit'],
  extra?: Partial<Omit<MealIngredient, 'id' | 'name' | 'quantity' | 'unit'>>,
): MealIngredient {
  return { id, name, quantity, unit, ...extra }
}

/** Måltider med stabile demo-id-er (kobles fra ukeplan). */
function demoMeals(profileId: string): Meal[] {
  return [
    {
      id: 'demo-mh-meal-havre',
      title: 'Havregrøt med bær',
      description: 'Rask frokost — topp med honning om ønskelig.',
      defaultServings: 2,
      tags: ['breakfast', 'snack'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-h1', 'Havregryn', 120, 'g', { section: 'Tørrvarer' }),
        ing('demo-mh-i-h2', 'Melk', 4, 'dl', { section: 'Meieri' }),
        ing('demo-mh-i-h3', 'Blåbær', 100, 'g', { section: 'Grønt', isStaple: false }),
        ing('demo-mh-i-h4', 'Honning', 1, 'ss', { section: 'Tørrvarer', isStaple: true }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
    {
      id: 'demo-mh-meal-yoghurt',
      title: 'Yoghurt med müsli og banan',
      defaultServings: 2,
      tags: ['breakfast', 'lunch', 'snack'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-y1', 'Naturell yoghurt', 400, 'g', { section: 'Meieri' }),
        ing('demo-mh-i-y2', 'Müsli', 80, 'g', { section: 'Tørrvarer' }),
        ing('demo-mh-i-y3', 'Banan', 2, 'stk', { section: 'Grønt' }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
    {
      id: 'demo-mh-meal-pasta',
      title: 'Pasta med pesto og kylling',
      defaultServings: 4,
      tags: ['dinner', 'evening'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-p1', 'Pastaskruer', 400, 'g', { section: 'Tørrvarer' }),
        ing('demo-mh-i-p2', 'Pesto', 1, 'stk', { section: 'Tørrvarer', note: 'glass' }),
        ing('demo-mh-i-p3', 'Kyllingfilet', 500, 'g', { section: 'Kjøtt' }),
        ing('demo-mh-i-p4', 'Parmesan', 50, 'g', { section: 'Meieri', isStaple: true }),
        ing('demo-mh-i-p5', 'Cherrytomat', 200, 'g', { section: 'Grønt' }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
    {
      id: 'demo-mh-meal-taco',
      title: 'Tacoskjell med kjøttdeig',
      defaultServings: 4,
      tags: ['dinner', 'evening'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-t1', 'Kjøttdeig', 400, 'g', { section: 'Kjøtt' }),
        ing('demo-mh-i-t2', 'Tacokrydder', 1, 'pakke', { section: 'Tørrvarer', isStaple: true }),
        ing('demo-mh-i-t3', 'Tacoskjell', 1, 'pakke', { section: 'Tørrvarer' }),
        ing('demo-mh-i-t4', 'Rømme', 2, 'dl', { section: 'Meieri' }),
        ing('demo-mh-i-t5', 'Norvegia revet', 150, 'g', { section: 'Meieri' }),
        ing('demo-mh-i-t6', 'Isbergsalat', 0.5, 'stk', { section: 'Grønt' }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
    {
      id: 'demo-mh-meal-suppe',
      title: 'Kremet fiskesuppe',
      defaultServings: 4,
      tags: ['dinner', 'evening', 'lunch'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-s1', 'Laks', 400, 'g', { section: 'Kjøtt' }),
        ing('demo-mh-i-s2', 'Potet', 4, 'stk', { section: 'Grønt' }),
        ing('demo-mh-i-s3', 'Gulrot', 2, 'stk', { section: 'Grønt' }),
        ing('demo-mh-i-s4', 'Fiskebuljong', 1, 'l', { section: 'Tørrvarer', isStaple: true }),
        ing('demo-mh-i-s5', 'Fløte', 2, 'dl', { section: 'Meieri' }),
        ing('demo-mh-i-s6', 'Dill', 0.5, 'neve', { section: 'Grønt' }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
    {
      id: 'demo-mh-meal-grateng',
      title: 'Fiskegrateng med brokkoli',
      defaultServings: 4,
      tags: ['dinner', 'evening'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-g1', 'Fiskegrateng frossen', 800, 'g', { section: 'Fryse', note: 'pose' }),
        ing('demo-mh-i-g2', 'Brokkoli', 300, 'g', { section: 'Grønt' }),
        ing('demo-mh-i-g3', 'Sitron', 1, 'stk', { section: 'Grønt' }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
    {
      id: 'demo-mh-meal-omelett',
      title: 'Omelett med spinat og ost',
      defaultServings: 2,
      tags: ['breakfast', 'lunch', 'dinner', 'evening'],
      createdByProfileId: profileId,
      ingredients: [
        ing('demo-mh-i-o1', 'Egg', 6, 'stk', { section: 'Meieri' }),
        ing('demo-mh-i-o2', 'Spinat', 100, 'g', { section: 'Grønt' }),
        ing('demo-mh-i-o3', 'Ost', 100, 'g', { section: 'Meieri' }),
        ing('demo-mh-i-o4', 'Smør', 1, 'ss', { section: 'Meieri', isStaple: true }),
      ],
      createdAt: DEMO_TS,
      updatedAt: DEMO_TS,
    },
  ]
}

function slot(mealId: string, servings: number | null = null): { mealId: string; servings: number | null } {
  return { mealId, servings }
}

function buildWeekPlan(weekStart: Date): Record<string, DayPlan> {
  const keys = Array.from({ length: 7 }, (_, i) => dateKeyFromDate(addDays(weekStart, i)))
  const plans: Partial<Record<string, DayPlan>> = {}

  const set = (i: number, slots: Partial<Record<MealSlotId, ReturnType<typeof slot>>>) => {
    const k = keys[i]
    if (!k) return
    plans[k] = { slots: slots as DayPlan['slots'] }
  }

  set(0, { breakfast: slot('demo-mh-meal-havre', 2), dinner: slot('demo-mh-meal-pasta', 4) })
  set(1, { lunch: slot('demo-mh-meal-yoghurt', 2), dinner: slot('demo-mh-meal-taco', 4) })
  set(2, { dinner: slot('demo-mh-meal-suppe', 4) })
  set(3, { breakfast: slot('demo-mh-meal-yoghurt', 2), dinner: slot('demo-mh-meal-grateng', 4) })
  set(4, { dinner: slot('demo-mh-meal-omelett', 2) })
  set(5, { lunch: slot('demo-mh-meal-omelett', 2), dinner: slot('demo-mh-meal-taco', 4) })
  set(6, { breakfast: slot('demo-mh-meal-havre', 2), dinner: slot('demo-mh-meal-pasta', 3) })

  return plans as Record<string, DayPlan>
}

function listItem(
  partial: Omit<ShoppingListItem, 'normalizedKey' | 'createdAt' | 'updatedAt'> & { normalizedKey?: string },
): ShoppingListItem {
  const now = DEMO_TS
  const nk = partial.normalizedKey ?? normalizeIngredientKey(partial.displayName)
  const classic = lookupClassicByNormalizedKey(nk)
  const unitPriceNok =
    partial.unitPriceNok !== undefined ? partial.unitPriceNok : classic?.unitPriceNok ?? null
  return {
    ...partial,
    normalizedKey: nk,
    unitPriceNok,
    createdAt: now,
    updatedAt: now,
  }
}

function demoShoppingList(profileId: string): ShoppingListItem[] {
  const srcPasta: ListItemSource = {
    mealId: 'demo-mh-meal-pasta',
    mealTitle: 'Pasta med pesto og kylling',
    slotLabel: 'Middag',
    date: undefined,
  }
  const srcTaco: ListItemSource = {
    mealId: 'demo-mh-meal-taco',
    mealTitle: 'Tacoskjell med kjøttdeig',
    slotLabel: 'Middag',
  }

  return [
    listItem({
      id: 'demo-mh-li-1',
      displayName: 'Kyllingfilet',
      quantity: 500,
      unit: 'g',
      categoryId: 'kjott',
      checked: false,
      sources: [srcPasta],
      manual: false,
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-2',
      displayName: 'Pastaskruer',
      quantity: 400,
      unit: 'g',
      categoryId: 'torr',
      checked: true,
      note: 'fullkorn',
      sources: [srcPasta],
      manual: false,
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-3',
      displayName: 'Cherrytomat',
      quantity: 200,
      unit: 'g',
      categoryId: 'gronn',
      checked: false,
      sources: [srcPasta],
      manual: false,
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-4',
      displayName: 'Kjøttdeig',
      quantity: 400,
      unit: 'g',
      categoryId: 'kjott',
      checked: false,
      sources: [srcTaco],
      manual: false,
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-5',
      displayName: 'Rømme',
      quantity: 2,
      unit: 'dl',
      categoryId: 'meieri',
      checked: false,
      sources: [srcTaco],
      manual: false,
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-6',
      displayName: 'Paprika',
      quantity: 2,
      unit: 'stk',
      categoryId: 'gronn',
      checked: false,
      manual: true,
      sources: [],
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-7',
      displayName: 'Kaffe',
      quantity: 1,
      unit: 'stk',
      categoryId: 'drikke',
      checked: false,
      note: 'filterpose',
      manual: true,
      sources: [],
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-8',
      displayName: 'Appelsinjuice',
      quantity: 1,
      unit: 'l',
      categoryId: 'drikke',
      checked: true,
      manual: true,
      sources: [],
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-9',
      displayName: 'Smør',
      quantity: 1,
      unit: 'stk',
      categoryId: 'meieri',
      checked: false,
      manual: true,
      sources: [],
      addedFromProfileId: profileId,
    }),
    listItem({
      id: 'demo-mh-li-10',
      displayName: 'Brokkoli',
      quantity: 300,
      unit: 'g',
      categoryId: 'gronn',
      checked: false,
      manual: true,
      sources: [],
      addedFromProfileId: profileId,
    }),
  ]
}

function demoActivity(profileId: string): MatActivityEvent[] {
  return [
    {
      id: 'demo-mh-act-1',
      at: DEMO_TS,
      profileId,
      type: 'item_added',
      message: 'La til: Paprika (manuelt)',
    },
    {
      id: 'demo-mh-act-2',
      at: DEMO_TS,
      profileId,
      type: 'plan_changed',
      message: 'Oppdaterte plan for uken (demodata)',
    },
    {
      id: 'demo-mh-act-3',
      at: DEMO_TS,
      profileId,
      type: 'item_checked',
      message: 'Krysset av pastaskruer',
    },
  ]
}

/**
 * Komplett eksempeltilstand for «Mat og handleliste» når demodata er på.
 * Ukeplan følger inneværende uke (mandag–søndag) slik at uke- og månedsvisning er relevante.
 */
export function createDemoMatHandlelisteState(
  profileId: string,
  referenceDate: Date = new Date(),
): MatHandlelisteState {
  const weekStart = startOfWeekMonday(referenceDate)
  const meals = demoMeals(profileId)
  const planByDate = buildWeekPlan(weekStart)
  const list = demoShoppingList(profileId)
  const staples = ['havregryn', 'salt', 'olje', 'mel'].map((x) => normalizeIngredientKey(x))
  const activity = demoActivity(profileId)

  const raw: MatHandlelisteState = {
    version: 1,
    meals,
    planByDate,
    list,
    categoryOrder: normalizeMatHandlelisteState({}).categoryOrder,
    staples,
    activity,
    settings: {
      groceryBudgetCategoryName: 'Mat & dagligvarer',
      planVisibleSlots: [...MEAL_SLOT_ORDER],
      planWeekLayout: 'auto',
    },
  }
  return normalizeMatHandlelisteState(raw)
}

export function matSnapshotContainsDemoMarkers(state: MatHandlelisteState): boolean {
  return state.meals.some((m) => typeof m.id === 'string' && m.id.startsWith('demo-mh-meal-'))
}

/** Ingen måltider, plan eller liste — trygt å fylle med demodata uten å slette brukerinnhold. */
export function isMatHandlelisteShellEmpty(state: MatHandlelisteState): boolean {
  return (
    state.meals.length === 0 &&
    state.list.length === 0 &&
    Object.keys(state.planByDate).length === 0
  )
}
