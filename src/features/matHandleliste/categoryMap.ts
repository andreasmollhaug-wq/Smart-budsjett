import { normalizeIngredientKey } from './ingredientKey'
import type { IngredientUnit } from './types'

export interface ShoppingCategoryDef {
  id: string
  label: string
  /** Ord i varenavn (normalisert lowercase) som tyder på denne kategorien */
  keywords: string[]
}

/** Standard kategorier — rekkefølge i UI styres av state.categoryOrder */
export const DEFAULT_SHOPPING_CATEGORIES: ShoppingCategoryDef[] = [
  { id: 'gronn', label: 'Grønt og frukt', keywords: ['løk', 'potet', 'gulrot', 'tomat', 'salat', 'brokkoli', 'paprika', 'agurk', 'sitron', 'lime', 'eple', 'banan', 'bær', 'spinat', 'kål', 'sopp', 'ingefær', 'hvitløk', 'persille', 'dill', 'koriander', 'selleri', 'purre', 'squash', 'aubergine', 'melon', 'appelsin', 'kiwi', 'avokado', 'chili', 'gresskar'] },
  { id: 'meieri', label: 'Meieri og egg', keywords: ['melk', 'fløte', 'rømme', 'smør', 'ost', 'yoghurt', 'egg', 'crème', 'creme', 'parmesan', 'mozzarella', 'feta', 'cottage'] },
  { id: 'kjott', label: 'Kjøtt og fisk', keywords: ['kjøtt', 'kylling', 'svine', 'storfe', 'lam', 'bacon', 'pølse', 'kjøttdeig', 'laks', 'torsk', 'sei', 'reke', 'tunfisk', 'sild', 'makrell', 'fisk', 'burger'] },
  { id: 'torr', label: 'Tørrvarer', keywords: ['ris', 'pasta', 'mel', 'havre', 'quinoa', 'bulgur', 'couscous', 'bønne', 'linser', 'kikerter', 'nøtter', 'mandler', 'rosin', 'sukker', 'salt', 'pepper', 'krydder', 'buljong', 'tomatpuré', 'boks', 'hermetisk', 'olje', 'eddik', 'sennep', 'majones', 'soya', 'worcester', 'honning', 'sirup', 'sjokolade', 'kakao', 'gryn'] },
  { id: 'fryse', label: 'Frysevarer', keywords: ['frossen', 'fryst', 'iskrem', 'pizza frossen'] },
  { id: 'drikke', label: 'Drikke', keywords: ['juice', 'brus', 'vann', 'øl', 'vin', 'kaffe', 'te', 'saft'] },
  { id: 'annet', label: 'Annet', keywords: [] },
]

export const DEFAULT_CATEGORY_ORDER: string[] = DEFAULT_SHOPPING_CATEGORIES.map((c) => c.id)

const CAT_BY_ID = Object.fromEntries(DEFAULT_SHOPPING_CATEGORIES.map((c) => [c.id, c]))

export function categoryLabel(id: string): string {
  return CAT_BY_ID[id]?.label ?? id
}

export function suggestCategoryId(normalizedName: string): string {
  const n = normalizedName.trim()
  if (!n) return 'annet'
  for (const cat of DEFAULT_SHOPPING_CATEGORIES) {
    if (cat.id === 'annet') continue
    for (const kw of cat.keywords) {
      const kn = normalizeIngredientKey(kw)
      if (kn && n.includes(kn)) return cat.id
    }
  }
  return 'annet'
}

/** Sammenligningsnøkkel for sammenslåing: enhet + ev. fritekst for other */
export function mergeGroupKey(normalizedKey: string, unit: IngredientUnit, unitLabel?: string): string {
  const ul = unit === 'other' ? (unitLabel ?? '').trim().toLowerCase() : ''
  return `${normalizedKey}\u0000${unit}\u0000${ul}`
}
