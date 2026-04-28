import { appendManualItemToShoppingList } from '@/features/matHandleliste/mergeIngredients'
import { generateId } from '@/lib/utils'
import type { SavedShoppingList, SavedShoppingListLine, ShoppingListItem } from '@/features/matHandleliste/types'

export const MAX_SAVED_SHOPPING_LISTS = 20
export const MAX_SAVED_SHOPPING_LIST_NAME_LEN = 60
export const MAX_LINES_PER_SAVED_SHOPPING_LIST = 120

export function snapshotLinesFromShoppingList(list: ShoppingListItem[]): SavedShoppingListLine[] {
  const out: SavedShoppingListLine[] = []
  for (const it of list) {
    if (out.length >= MAX_LINES_PER_SAVED_SHOPPING_LIST) break
    out.push({
      displayName: it.displayName,
      normalizedKey: it.normalizedKey,
      quantity: it.quantity,
      unit: it.unit,
      ...(it.unitLabel ? { unitLabel: it.unitLabel } : {}),
      categoryId: it.categoryId,
      note: it.note ?? null,
      unitPriceNok: it.unitPriceNok ?? null,
    })
  }
  return out
}

export function applySavedLinesToShoppingList(
  existing: ShoppingListItem[],
  lines: SavedShoppingListLine[],
  profileId: string,
  now: string,
  mode: 'merge' | 'replace',
): ShoppingListItem[] {
  let acc: ShoppingListItem[] =
    mode === 'replace' ? [] : existing.map((x) => ({ ...x }))
  for (const ln of lines) {
    const name = ln.displayName.trim()
    if (!name) continue
    acc = appendManualItemToShoppingList(
      acc,
      name,
      profileId,
      now,
      ln.categoryId,
      ln.note ?? undefined,
      ln.unitPriceNok !== undefined && ln.unitPriceNok !== null ? ln.unitPriceNok : undefined,
      {
        quantity: ln.quantity ?? undefined,
        unit: ln.unit,
        unitLabel: ln.unitLabel ?? null,
      },
    )
  }
  return acc
}

export function newSavedShoppingList(name: string, lines: SavedShoppingListLine[]): SavedShoppingList {
  const t = new Date().toISOString()
  return {
    id: generateId(),
    name: name.trim().slice(0, MAX_SAVED_SHOPPING_LIST_NAME_LEN) || 'Liste',
    createdAt: t,
    updatedAt: t,
    lines,
  }
}
