import {
  MAT_HANDLELISTE_VERSION,
  MAT_HANDLELISTE_ACTIVITY_MAX,
  MEAL_SLOT_ORDER,
  type DayPlan,
  type ListItemSource,
  type MatActivityEvent,
  type MatHandlelisteState,
  type Meal,
  type MealIngredient,
  type PlannedSlot,
  type ShoppingListItem,
  type IngredientUnit,
  type MealSlotId,
  type MatHandlelisteSettings,
  type PlanWeekLayout,
} from './types'
import { DEFAULT_CATEGORY_ORDER } from './categoryMap'
import { normalizeIngredientKey } from './ingredientKey'

const MEAL_SLOT_SET = new Set<MealSlotId>(MEAL_SLOT_ORDER)

const DEFAULT_PLAN_SETTINGS: Pick<MatHandlelisteSettings, 'planVisibleSlots' | 'planWeekLayout'> = {
  planVisibleSlots: [...MEAL_SLOT_ORDER],
  planWeekLayout: 'auto',
}

/** Normaliserer og sorterer synlige plan-slots; minst ett tidsrom (full liste ved tom input). */
export function normalizePlanVisibleSlots(input: unknown): MealSlotId[] {
  const raw = Array.isArray(input) ? input : []
  const picked = new Set<MealSlotId>()
  for (const x of raw) {
    if (typeof x === 'string' && MEAL_SLOT_SET.has(x as MealSlotId)) {
      picked.add(x as MealSlotId)
    }
  }
  const ordered: MealSlotId[] = []
  for (const s of MEAL_SLOT_ORDER) {
    if (picked.has(s)) ordered.push(s)
  }
  return ordered.length > 0 ? ordered : [...MEAL_SLOT_ORDER]
}

export function normalizePlanWeekLayout(raw: unknown): PlanWeekLayout {
  if (raw === 'grid' || raw === 'list' || raw === 'auto') return raw
  return 'auto'
}

/** Eldre lagring: `snack` var «kveld» — flytt til `evening`. */
function migrateLegacyPlanSlots(slots: Record<string, unknown>): Record<string, unknown> {
  const o = { ...slots }
  if ('snack' in o && o.snack != null) {
    if (!('evening' in o) || o.evening == null) {
      o.evening = o.snack
    }
    delete o.snack
  }
  return o
}

function normalizeMealTags(raw: unknown): MealSlotId[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: MealSlotId[] = []
  for (const x of raw) {
    if (typeof x !== 'string') continue
    const id = x as MealSlotId
    if (!MEAL_SLOT_SET.has(id)) continue
    if (!out.includes(id)) out.push(id)
    if (out.length >= MEAL_SLOT_ORDER.length) break
  }
  return out.length ? out : undefined
}

/** Til bruk fra store ved oppdatering uten full meal-normalisering */
export function clampMealSlotTags(tags: MealSlotId[] | undefined): MealSlotId[] | undefined {
  if (!tags?.length) return undefined
  return normalizeMealTags(tags)
}

function clampIngredientUnit(raw: unknown): IngredientUnit {
  const u = typeof raw === 'string' ? raw : 'stk'
  const allowed: IngredientUnit[] = ['stk', 'g', 'kg', 'ml', 'dl', 'l', 'ss', 'ts', 'pakke', 'neve', 'other']
  return allowed.includes(u as IngredientUnit) ? (u as IngredientUnit) : 'stk'
}

function normalizeIngredient(raw: unknown): MealIngredient | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<MealIngredient>
  if (typeof o.id !== 'string' || !o.id) return null
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!name) return null
  let quantity: number | null = null
  if (o.quantity != null) {
    const q = typeof o.quantity === 'number' ? o.quantity : Number(o.quantity)
    if (Number.isFinite(q)) quantity = q
    else quantity = null
  }
  const unit = clampIngredientUnit(o.unit)
  const unitLabel =
    typeof o.unitLabel === 'string' && o.unitLabel.trim() ? o.unitLabel.trim().slice(0, 32) : undefined
  const note = typeof o.note === 'string' ? o.note.trim().slice(0, 200) : undefined
  const section = typeof o.section === 'string' ? o.section.trim().slice(0, 80) : undefined
  const isStaple = o.isStaple === true
  return {
    id: o.id.slice(0, 64),
    name: name.slice(0, 200),
    quantity,
    unit,
    ...(unitLabel ? { unitLabel } : {}),
    ...(note ? { note } : {}),
    ...(section ? { section } : {}),
    ...(isStaple ? { isStaple: true } : {}),
  }
}

function normalizeMeal(raw: unknown): Meal | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<Meal>
  if (typeof o.id !== 'string' || !o.id) return null
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  if (!title) return null
  const ingIn = o.ingredients
  const ingredients: MealIngredient[] = Array.isArray(ingIn)
    ? (ingIn.map(normalizeIngredient).filter(Boolean) as MealIngredient[])
    : []
  let defaultServings = typeof o.defaultServings === 'number' ? o.defaultServings : Number(o.defaultServings)
  if (!Number.isFinite(defaultServings) || defaultServings <= 0) defaultServings = 4
  defaultServings = Math.min(50, Math.max(1, Math.round(defaultServings)))
  const description =
    typeof o.description === 'string' && o.description.trim() ? o.description.trim().slice(0, 500) : undefined
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : createdAt
  const tags = normalizeMealTags(o.tags)
  const createdByProfileId =
    typeof o.createdByProfileId === 'string' && o.createdByProfileId.trim()
      ? o.createdByProfileId.trim().slice(0, 64)
      : 'default'
  return {
    id: o.id.slice(0, 64),
    title: title.slice(0, 200),
    ...(description ? { description } : {}),
    defaultServings,
    ingredients,
    ...(tags?.length ? { tags } : {}),
    createdByProfileId,
    createdAt,
    updatedAt,
  }
}

function isYyyyMmDd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function normalizePlannedSlot(raw: unknown): PlannedSlot | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<PlannedSlot>
  if (typeof o.mealId !== 'string' || !o.mealId) return null
  let servings: number | null = null
  if (o.servings != null) {
    const v = typeof o.servings === 'number' ? o.servings : Number(o.servings)
    if (Number.isFinite(v) && v > 0) servings = Math.min(50, Math.round(v))
    else servings = null
  }
  return { mealId: o.mealId.slice(0, 64), servings }
}

function normalizeDayPlan(raw: unknown): DayPlan {
  const slots: DayPlan['slots'] = {}
  if (!raw || typeof raw !== 'object') return { slots }
  const s0 = (raw as DayPlan).slots
  if (!s0 || typeof s0 !== 'object') return { slots }
  const s = migrateLegacyPlanSlots(s0 as Record<string, unknown>)
  for (const key of MEAL_SLOT_ORDER) {
    const slotRaw = s[key]
    if (slotRaw == null) continue
    const ps = normalizePlannedSlot(slotRaw)
    if (ps) slots[key] = ps
  }
  return { slots }
}

function normalizeListItem(raw: unknown): ShoppingListItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<ShoppingListItem>
  if (typeof o.id !== 'string' || !o.id) return null
  const displayName = typeof o.displayName === 'string' ? o.displayName.trim() : ''
  if (!displayName) return null
  const normalizedKey =
    typeof o.normalizedKey === 'string' && o.normalizedKey
      ? o.normalizedKey
      : normalizeIngredientKey(displayName)
  let quantity: number | null = null
  if (o.quantity != null) {
    const q = typeof o.quantity === 'number' ? o.quantity : Number(o.quantity)
    quantity = Number.isFinite(q) ? q : null
  }
  const unit = clampIngredientUnit(o.unit)
  const unitLabel =
    typeof o.unitLabel === 'string' && o.unitLabel.trim() ? o.unitLabel.trim().slice(0, 32) : undefined
  const categoryId =
    typeof o.categoryId === 'string' && o.categoryId ? o.categoryId.slice(0, 32) : 'annet'
  const checked = o.checked === true
  const note = typeof o.note === 'string' ? o.note.trim().slice(0, 200) : undefined
  const sources: ListItemSource[] = Array.isArray(o.sources)
    ? o.sources
        .map((x) => {
          if (!x || typeof x !== 'object') return null
          const s = x as Partial<ListItemSource>
          if (typeof s.mealId !== 'string' || typeof s.mealTitle !== 'string') return null
          return {
            mealId: s.mealId.slice(0, 64),
            mealTitle: s.mealTitle.slice(0, 200),
            ...(typeof s.slotLabel === 'string' ? { slotLabel: s.slotLabel.slice(0, 40) } : {}),
            ...(typeof s.date === 'string' && isYyyyMmDd(s.date) ? { date: s.date } : {}),
          }
        })
        .filter(Boolean) as ListItemSource[]
    : []
  const manual = o.manual === true
  let unitPriceNok: number | null = null
  if (o.unitPriceNok != null) {
    const p = typeof o.unitPriceNok === 'number' ? o.unitPriceNok : Number(o.unitPriceNok)
    if (Number.isFinite(p)) unitPriceNok = Math.max(0, Math.min(50_000, Math.round(p)))
  }
  const addedFromProfileId =
    typeof o.addedFromProfileId === 'string' ? o.addedFromProfileId.slice(0, 64) : 'default'
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : createdAt
  return {
    id: o.id.slice(0, 64),
    displayName: displayName.slice(0, 200),
    normalizedKey: normalizedKey.slice(0, 200),
    quantity,
    unit,
    ...(unitLabel ? { unitLabel } : {}),
    categoryId,
    checked,
    ...(unitPriceNok != null ? { unitPriceNok } : {}),
    ...(note ? { note } : {}),
    sources,
    manual,
    addedFromProfileId,
    createdAt,
    updatedAt,
  }
}

function normalizeActivity(raw: unknown): MatActivityEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<MatActivityEvent>
  if (typeof o.id !== 'string' || !o.id) return null
  const type = o.type
  const allowed: MatActivityEvent['type'][] = [
    'item_added',
    'item_checked',
    'item_unchecked',
    'cleared_checked',
    'meal_created',
    'plan_changed',
  ]
  const t = allowed.includes(type as MatActivityEvent['type']) ? (type as MatActivityEvent['type']) : 'item_added'
  const message = typeof o.message === 'string' ? o.message.trim().slice(0, 300) : ''
  if (!message) return null
  return {
    id: o.id.slice(0, 64),
    at: typeof o.at === 'string' ? o.at : new Date().toISOString(),
    profileId: typeof o.profileId === 'string' ? o.profileId.slice(0, 64) : 'default',
    type: t,
    message,
  }
}

export function createEmptyMatHandlelisteState(): MatHandlelisteState {
  return {
    version: MAT_HANDLELISTE_VERSION,
    meals: [],
    planByDate: {},
    list: [],
    categoryOrder: [...DEFAULT_CATEGORY_ORDER],
    staples: [],
    activity: [],
    settings: {
      groceryBudgetCategoryName: null,
      ...DEFAULT_PLAN_SETTINGS,
    },
  }
}

export function normalizeMatHandlelisteState(raw: unknown): MatHandlelisteState {
  const empty = createEmptyMatHandlelisteState()
  if (!raw || typeof raw !== 'object') return empty
  const r = raw as Partial<MatHandlelisteState>
  const mealsIn = r.meals
  const meals: Meal[] = Array.isArray(mealsIn)
    ? (mealsIn.map(normalizeMeal).filter(Boolean) as Meal[])
    : []
  const planByDate: Record<string, DayPlan> = {}
  const pbd = r.planByDate
  if (pbd && typeof pbd === 'object' && !Array.isArray(pbd)) {
    for (const [k, v] of Object.entries(pbd)) {
      if (!isYyyyMmDd(k)) continue
      planByDate[k] = normalizeDayPlan(v)
    }
  }
  const listIn = r.list
  const list: ShoppingListItem[] = Array.isArray(listIn)
    ? (listIn.map(normalizeListItem).filter(Boolean) as ShoppingListItem[])
    : []
  let categoryOrder: string[] = Array.isArray(r.categoryOrder)
    ? r.categoryOrder.filter((x): x is string => typeof x === 'string' && x.length > 0).map((x) => x.slice(0, 32))
    : [...DEFAULT_CATEGORY_ORDER]
  const known = new Set(DEFAULT_CATEGORY_ORDER)
  categoryOrder = categoryOrder.filter((id) => known.has(id))
  for (const id of DEFAULT_CATEGORY_ORDER) {
    if (!categoryOrder.includes(id)) categoryOrder.push(id)
  }
  const staples: string[] = Array.isArray(r.staples)
    ? [
        ...new Set(
          r.staples
            .filter((x): x is string => typeof x === 'string' && x.length > 0)
            .map((x) => x.slice(0, 200)),
        ),
      ]
    : []
  const actIn = r.activity
  const activity: MatActivityEvent[] = Array.isArray(actIn)
    ? (actIn.map(normalizeActivity).filter(Boolean) as MatActivityEvent[])
    : []
  const settingsRaw = r.settings
  let groceryBudgetCategoryName: string | null = null
  let planVisibleSlotsIn: unknown
  let planWeekLayoutIn: unknown
  if (settingsRaw && typeof settingsRaw === 'object') {
    const g = (settingsRaw as { groceryBudgetCategoryName?: unknown }).groceryBudgetCategoryName
    if (typeof g === 'string' && g.trim()) groceryBudgetCategoryName = g.trim().slice(0, 120)
    planVisibleSlotsIn = (settingsRaw as { planVisibleSlots?: unknown }).planVisibleSlots
    planWeekLayoutIn = (settingsRaw as { planWeekLayout?: unknown }).planWeekLayout
  }
  const planVisibleSlots = normalizePlanVisibleSlots(planVisibleSlotsIn ?? DEFAULT_PLAN_SETTINGS.planVisibleSlots)
  const planWeekLayout = normalizePlanWeekLayout(planWeekLayoutIn ?? DEFAULT_PLAN_SETTINGS.planWeekLayout)
  return {
    version: MAT_HANDLELISTE_VERSION,
    meals,
    planByDate,
    list,
    categoryOrder,
    staples,
    activity: activity.slice(-MAT_HANDLELISTE_ACTIVITY_MAX),
    settings: { groceryBudgetCategoryName, planVisibleSlots, planWeekLayout },
  }
}
