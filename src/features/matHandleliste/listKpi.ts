import { estimatedShoppingListLineTotalNok } from './estimateShoppingListPrice'
import type { ShoppingListItem } from './types'

export function shoppingListRemainingKpi(list: ShoppingListItem[]): {
  remainingCount: number
  pricedCount: number
  sumNok: number
} {
  const remaining = list.filter((it) => !it.checked)
  const withPrice = remaining.filter((it) => it.unitPriceNok != null)
  const sumNok = withPrice.reduce((s, it) => {
    const line = estimatedShoppingListLineTotalNok(it) ?? 0
    return s + line
  }, 0)
  return {
    remainingCount: remaining.length,
    pricedCount: withPrice.length,
    sumNok,
  }
}
