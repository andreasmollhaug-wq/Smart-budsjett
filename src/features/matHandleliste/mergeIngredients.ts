import { generateId } from '@/lib/utils'
import { lookupClassicByNormalizedKey } from './classicGroceries'
import { mergeGroupKey, suggestCategoryId } from './categoryMap'
import { clampShoppingListQuantity } from './ingredientUnitOptions'
import { normalizeIngredientKey } from './ingredientKey'
import type { IngredientUnit, ListItemSource, MealIngredient, ShoppingListItem } from './types'

export { normalizeIngredientKey } from './ingredientKey'

export function scaleQuantity(quantity: number | null, factor: number): number | null {
  if (quantity == null || !Number.isFinite(quantity)) return null
  if (!Number.isFinite(factor) || factor <= 0) return quantity
  const scaled = quantity * factor
  const unitish = Math.abs(scaled - Math.round(scaled)) < 1e-9
  if (unitish) return Math.round(scaled)
  return Math.round(scaled * 100) / 100
}

export function portionFactorForMeal(defaultServings: number, effectiveServings: number): number {
  const d = defaultServings > 0 ? defaultServings : 4
  const e = effectiveServings > 0 ? effectiveServings : d
  return e / d
}

export interface IngredientLineInput {
  displayName: string
  normalizedKey: string
  quantity: number | null
  unit: IngredientUnit
  unitLabel?: string
  note?: string
  source: ListItemSource
}

function roundQtyForMerge(a: number, b: number): number {
  const s = a + b
  if (Math.abs(s - Math.round(s)) < 1e-9) return Math.round(s)
  return Math.round(s * 100) / 100
}

/**
 * Slår sammen nye ingredienslinjer med eksisterende liste (kun med ikke-avkryssede matcher).
 */
export function appendIngredientsToShoppingList(
  existing: ShoppingListItem[],
  lines: IngredientLineInput[],
  profileId: string,
  now: string,
): ShoppingListItem[] {
  const next = existing.map((x) => ({ ...x }))
  for (const line of lines) {
    const classic = lookupClassicByNormalizedKey(line.normalizedKey)
    const cat = classic?.categoryId ?? suggestCategoryId(line.normalizedKey)
    const catalogPrice = classic?.unitPriceNok ?? null
    const gk = mergeGroupKey(line.normalizedKey, line.unit, line.unitLabel)
    const idx = next.findIndex(
      (it) =>
        !it.checked &&
        !it.manual &&
        mergeGroupKey(it.normalizedKey, it.unit, it.unitLabel) === gk,
    )
    if (idx >= 0) {
      const cur = next[idx]!
      const q1 = cur.quantity
      const q2 = line.quantity
      let newQ: number | null = null
      if (q1 != null && q2 != null) newQ = roundQtyForMerge(q1, q2)
      else if (q1 != null) newQ = q1
      else if (q2 != null) newQ = q2
      const src = [...cur.sources, line.source]
      const titles = [...new Set(src.map((s) => s.mealTitle))]
      const curPrice = cur.unitPriceNok ?? null
      const mergedPrice = curPrice != null ? curPrice : catalogPrice
      next[idx] = {
        ...cur,
        quantity: newQ,
        sources: src,
        displayName: cur.displayName,
        note: cur.note || line.note,
        categoryId: cur.categoryId === 'annet' ? cat : cur.categoryId,
        unitPriceNok: mergedPrice ?? null,
        updatedAt: now,
      }
      if (titles.length > 1) {
        /* behold displayName fra første, kilder viser resten */
      }
    } else {
      next.push({
        id: generateId(),
        displayName: line.displayName,
        normalizedKey: line.normalizedKey,
        quantity: line.quantity,
        unit: line.unit,
        ...(line.unitLabel ? { unitLabel: line.unitLabel } : {}),
        categoryId: cat,
        unitPriceNok: catalogPrice,
        checked: false,
        ...(line.note ? { note: line.note } : {}),
        sources: [line.source],
        manual: false,
        addedFromProfileId: profileId,
        createdAt: now,
        updatedAt: now,
      })
    }
  }
  return next
}

export function appendManualItemToShoppingList(
  existing: ShoppingListItem[],
  displayName: string,
  profileId: string,
  now: string,
  categoryId?: string,
  note?: string,
  unitPriceNok?: number | null,
  opts?: {
    quantity?: number | null
    unit?: IngredientUnit
    unitLabel?: string | null
  },
): ShoppingListItem[] {
  const trimmed = displayName.trim()
  if (!trimmed) return existing.map((x) => ({ ...x }))
  const normalizedKey = normalizeIngredientKey(trimmed)
  const classic = lookupClassicByNormalizedKey(normalizedKey)
  const cat =
    categoryId && categoryId.length > 0 ? categoryId : classic?.categoryId ?? suggestCategoryId(normalizedKey)
  let price: number | null
  if (unitPriceNok !== undefined && unitPriceNok !== null) {
    price = Math.max(0, Math.min(50_000, Math.round(unitPriceNok)))
  } else if (unitPriceNok === null) {
    price = null
  } else {
    price = classic?.unitPriceNok ?? null
  }

  const unit: IngredientUnit = opts?.unit ?? 'stk'
  let quantity: number | null
  if (opts?.quantity === undefined) {
    quantity = 1
  } else if (opts.quantity === null) {
    quantity = null
  } else {
    quantity = clampShoppingListQuantity(opts.quantity)
  }

  const manualItem: ShoppingListItem = {
    id: generateId(),
    displayName: trimmed.slice(0, 200),
    normalizedKey,
    quantity,
    unit,
    categoryId: cat,
    unitPriceNok: price,
    checked: false,
    ...(note ? { note: note.slice(0, 200) } : {}),
    sources: [],
    manual: true,
    addedFromProfileId: profileId,
    createdAt: now,
    updatedAt: now,
  }
  if (unit === 'other') {
    const lab = opts?.unitLabel?.trim()
    if (lab) manualItem.unitLabel = lab.slice(0, 64)
  }

  return [...existing.map((x) => ({ ...x })), manualItem]
}

export function mealIngredientToLines(
  ingredients: MealIngredient[],
  factor: number,
  source: ListItemSource,
): IngredientLineInput[] {
  const out: IngredientLineInput[] = []
  for (const ing of ingredients) {
    const normalizedKey = normalizeIngredientKey(ing.name)
    const qty = scaleQuantity(ing.quantity, factor)
    const noteParts: string[] = []
    if (ing.note) noteParts.push(ing.note)
    if (ing.unit === 'other' && ing.unitLabel) noteParts.push(ing.unitLabel)
    out.push({
      displayName: ing.name.trim(),
      normalizedKey,
      quantity: qty,
      unit: ing.unit,
      ...(ing.unit === 'other' && ing.unitLabel ? { unitLabel: ing.unitLabel } : {}),
      ...(noteParts.length ? { note: noteParts.join(' · ') } : {}),
      source,
    })
  }
  return out
}
