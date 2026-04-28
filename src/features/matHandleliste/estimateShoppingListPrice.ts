import type { IngredientUnit, ShoppingListItem } from '@/features/matHandleliste/types'

/**
 * Katalogpriser (classicGroceries) er veiledende **NOK per kg** for vektvarer og **NOK per liter**
 * for oppskriftsenheter i ml/dl/l. Da er `mengde × katalogpris` bare riktig for stk/pk/osv.
 */
export function estimatedShoppingListLineTotalNok(it: ShoppingListItem): number | null {
  if (it.unitPriceNok == null) return null
  const q = it.quantity ?? 1
  const p = it.unitPriceNok
  let raw: number
  switch (it.unit) {
    case 'g':
      raw = (q / 1000) * p
      break
    case 'kg':
      raw = q * p
      break
    case 'ml':
      raw = (q / 1000) * p
      break
    case 'dl':
      raw = (q / 10) * p
      break
    case 'l':
      raw = q * p
      break
    default:
      raw = q * p
  }
  return Math.max(0, Math.round(raw))
}

/** Kort merkelapp for hva katalogprisen refererer til (f.eks. PDF-kolonne). */
export function catalogPriceBasisLabel(unit: IngredientUnit): 'kr/kg' | 'kr/l' | 'kr/enhet' {
  switch (unit) {
    case 'g':
    case 'kg':
      return 'kr/kg'
    case 'ml':
    case 'dl':
    case 'l':
      return 'kr/l'
    default:
      return 'kr/enhet'
  }
}

/** Lesbar setning etter formatNOK-verdi (handleliste-rad). */
export function catalogPriceBasisSuffix(unit: IngredientUnit): string {
  switch (unit) {
    case 'g':
    case 'kg':
      return 'pr. kg (katalog)'
    case 'ml':
    case 'dl':
    case 'l':
      return 'pr. liter (katalog)'
    default:
      return 'pr. oppgitt enhet (katalog)'
  }
}
