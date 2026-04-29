/**
 * Forslag til ingrediens-seksjon: historikk fra måltider og handleliste, deretter innbygd kategori-treff.
 */

import { categoryLabel, suggestCategoryId } from './categoryMap'
import { normalizeIngredientKey } from './ingredientKey'
import type { Meal, MealIngredient, ShoppingListItem } from './types'

/** Normalisert varenavn → seksjonstekst brukt tidligere (nyeste måltid vinner). */
export type IngredientSectionLookup = Record<string, string>

function compareMealUpdatedDesc(a: Meal, b: Meal): number {
  return b.updatedAt.localeCompare(a.updatedAt)
}

export type BuildIngredientSectionLookupOptions = {
  /** Ved redigering: utelat dette måltidets ingredienser i historikk (unngår at lagret måltid fyller seksjon brukeren nettopp tømte). */
  excludeMealId?: string
}

/**
 * Bygger oppslag fra måltider (sortert etter `updatedAt` synkende, nyeste først) og deretter manglende nøkler fra handleliste.
 */
export function buildIngredientSectionLookup(
  meals: Meal[],
  listItems?: ShoppingListItem[],
  options?: BuildIngredientSectionLookupOptions,
): IngredientSectionLookup {
  const out: IngredientSectionLookup = {}
  const excludeMealId = options?.excludeMealId
  const filtered = excludeMealId ? meals.filter((m) => m.id !== excludeMealId) : meals
  const sorted = [...filtered].sort(compareMealUpdatedDesc)

  for (const meal of sorted) {
    for (const ing of meal.ingredients) {
      const sec = ing.section?.trim()
      const name = ing.name.trim()
      if (!sec || !name) continue
      const k = normalizeIngredientKey(name)
      if (!k) continue
      if (out[k] !== undefined) continue
      out[k] = sec
    }
  }

  if (listItems?.length) {
    for (const it of listItems) {
      const name = it.displayName.trim()
      if (!name) continue
      const k = normalizeIngredientKey(name)
      if (!k) continue
      if (out[k] !== undefined) continue
      out[k] = categoryLabel(it.categoryId)
    }
  }

  return out
}

/**
 * Slår inn aktivt skjemautkast: rader med både navn og seksjon overskriver `base`
 * for samme normaliserte nøkkel (siste rad i rekken vinner ved duplikatnavn).
 */
export function mergeDraftIngredientsIntoLookup(
  base: IngredientSectionLookup,
  draft: MealIngredient[],
): IngredientSectionLookup {
  const out: IngredientSectionLookup = { ...base }
  for (const ing of draft) {
    const sec = ing.section?.trim()
    const name = ing.name.trim()
    if (!sec || !name) continue
    const k = normalizeIngredientKey(name)
    if (!k) continue
    out[k] = sec
  }
  return out
}

/**
 * Returnerer seksjonstekst å vise på ingrediens: først lagret tilpassing, deretter kategori fra nøkkelord (ikke «Annet»).
 */
export function suggestIngredientSection(
  trimmedName: string,
  lookup: IngredientSectionLookup,
): string | undefined {
  const name = trimmedName.trim()
  if (!name) return undefined
  const k = normalizeIngredientKey(name)
  if (!k) return undefined
  const fromHistory = lookup[k]
  if (fromHistory !== undefined && fromHistory.trim() !== '') return fromHistory

  const id = suggestCategoryId(k)
  if (id === 'annet') return undefined
  return categoryLabel(id)
}
