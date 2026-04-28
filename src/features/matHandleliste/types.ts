/**
 * Mat og handleliste — adskilt fra budsjett/transaksjoner.
 * Modulgrense: ingen import av transaksjons-API fra denne mappen.
 */

import type { ShoppingListPdfTemplate } from './printPdfLayout'

export type { ShoppingListPdfTemplate } from './printPdfLayout'
export type { ShoppingListPdfLayoutOptions } from './printPdfLayout'

export const MAT_HANDLELISTE_VERSION = 1
export const MAT_HANDLELISTE_ACTIVITY_MAX = 50

export type MealSlotId = 'breakfast' | 'lunch' | 'dinner' | 'evening' | 'snack'

/** Rekkefølge for plan, normalisering og gruppering i UI */
export const MEAL_SLOT_ORDER: MealSlotId[] = ['breakfast', 'lunch', 'dinner', 'evening', 'snack']

export type IngredientUnit =
  | 'stk'
  | 'g'
  | 'kg'
  | 'ml'
  | 'dl'
  | 'l'
  | 'ss'
  | 'ts'
  | 'pakke'
  | 'neve'
  | 'other'

export interface MealIngredient {
  id: string
  name: string
  quantity: number | null
  unit: IngredientUnit
  /** Når unit === 'other' */
  unitLabel?: string
  note?: string
  section?: string
  isStaple?: boolean
}

export interface Meal {
  id: string
  title: string
  description?: string
  defaultServings: number
  ingredients: MealIngredient[]
  /** Tom/utelatt = tilgjengelig i alle tidsrom i plan */
  tags?: MealSlotId[]
  /** Profil som opprettet måltidet */
  createdByProfileId: string
  createdAt: string
  updatedAt: string
}

/** Én planlagt måltid i en slot */
export interface PlannedSlot {
  mealId: string
  /** null = bruk måltidets standard porsjoner */
  servings: number | null
}

export type DayPlan = {
  slots: Partial<Record<MealSlotId, PlannedSlot>>
}

export interface ListItemSource {
  mealId: string
  mealTitle: string
  slotLabel?: string
  date?: string
}

export interface ShoppingListItem {
  id: string
  displayName: string
  normalizedKey: string
  quantity: number | null
  unit: IngredientUnit
  unitLabel?: string
  categoryId: string
  checked: boolean
  /**
   * Katalog/demo: typisk **NOK per kg** (g/kg) eller **NOK per l** (ml/dl/l).
   * For stk/pakke/neve/ss/osv.: NOK **per samme måleenhet som i mengden**.
   * Linjesum = `estimatedShoppingListLineTotalNok(...)`.
   */
  unitPriceNok?: number | null
  note?: string
  sources: ListItemSource[]
  /** true = lagt inn manuelt, ikke fra måltid */
  manual: boolean
  addedFromProfileId: string
  createdAt: string
  updatedAt: string
}

export type MatActivityType =
  | 'item_added'
  | 'item_checked'
  | 'item_unchecked'
  | 'cleared_checked'
  | 'meal_created'
  | 'plan_changed'

export interface MatActivityEvent {
  id: string
  at: string
  profileId: string
  type: MatActivityType
  message: string
}

/** Ukeplan-visning: auto = rutenett fra lg, liste under; grid/list tvinger modus. */
export type PlanWeekLayout = 'auto' | 'grid' | 'list'

/** Forhåndsdefinert handleliste (kopieres inn som manuelle rader). */
export interface SavedShoppingListLine {
  displayName: string
  normalizedKey: string
  quantity: number | null
  unit: IngredientUnit
  unitLabel?: string
  categoryId: string
  note?: string | null
  unitPriceNok?: number | null
}

export interface SavedShoppingList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  lines: SavedShoppingListLine[]
}

export interface MatHandlelisteSettings {
  /** Valgfritt budsjettlinjenavn brukeren vil knytte til (tom = auto-gjett) */
  groceryBudgetCategoryName: string | null
  /** Tidsrom som vises i plan (og som KPI/«legg på liste» teller med). Minst ett. */
  planVisibleSlots: MealSlotId[]
  planWeekLayout: PlanWeekLayout
  /** Lagrede PDF-utkast (navn + layout-flagg); se printPdfLayout */
  shoppingListPdfTemplates: ShoppingListPdfTemplate[]
  /** Sist valgte mal i eksport-modal (valgfritt) */
  shoppingListPdfLastTemplateId: string | null
}

export interface MatHandlelisteState {
  version: number
  meals: Meal[]
  planByDate: Record<string, DayPlan>
  list: ShoppingListItem[]
  /** Navngitte, forhåndsdefinerte handlelister brukeren kan laste inn igjen */
  savedShoppingLists: SavedShoppingList[]
  /** Rekkefølge på kategori-id fra categoryMap */
  categoryOrder: string[]
  /** Normaliserte nøkler for stiftvarer */
  staples: string[]
  activity: MatActivityEvent[]
  settings: MatHandlelisteSettings
}
