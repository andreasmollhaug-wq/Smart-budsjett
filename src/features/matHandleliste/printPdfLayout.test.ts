import { describe, expect, it } from 'vitest'
import { DEFAULT_SHOPPING_LIST_PDF_LAYOUT, mergeShoppingListPdfLayout } from './printPdfLayout'

describe('mergeShoppingListPdfLayout', () => {
  it('slår av summen når priskolonner er av', () => {
    const m = mergeShoppingListPdfLayout({
      ...DEFAULT_SHOPPING_LIST_PDF_LAYOUT,
      showPriceColumns: false,
      showEstimatedSumFooter: true,
    })
    expect(m.showEstimatedSumFooter).toBe(false)
  })
})
