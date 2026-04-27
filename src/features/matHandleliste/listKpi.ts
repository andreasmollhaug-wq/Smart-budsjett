import type { ShoppingListItem } from './types'

export function shoppingListRemainingKpi(list: ShoppingListItem[]): {
  remainingCount: number
  pricedCount: number
  sumNok: number
} {
  const remaining = list.filter((it) => !it.checked)
  const withPrice = remaining.filter((it) => it.unitPriceNok != null)
  const sumNok = withPrice.reduce((s, it) => {
    const unit = it.unitPriceNok ?? 0
    const q = it.quantity ?? 1
    return s + q * unit
  }, 0)
  return {
    remainingCount: remaining.length,
    pricedCount: withPrice.length,
    sumNok,
  }
}
