import type { IngredientUnit } from './types'

/** Nedtrekk for handleliste (mengde-enhet). */
export const SHOPPING_LIST_UNIT_OPTIONS: { value: IngredientUnit; label: string }[] = [
  { value: 'stk', label: 'Stk' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilo (kg)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'dl', label: 'Desiliter (dl)' },
  { value: 'l', label: 'Liter (l)' },
  { value: 'ss', label: 'Spiseskje (ss)' },
  { value: 'ts', label: 'Teskje (ts)' },
  { value: 'pakke', label: 'Pakke' },
  { value: 'neve', label: 'Neve' },
  { value: 'other', label: 'Annen (fritekst)' },
]

export function clampShoppingListQuantity(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1
  const capped = Math.min(raw, 1_000_000)
  if (Math.abs(capped - Math.round(capped)) < 1e-9) return Math.round(capped)
  return Math.round(capped * 1000) / 1000
}
