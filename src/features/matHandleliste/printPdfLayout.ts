/**
 * PDF-utskrift for handleliste/plan: hvilke blokker som vises (html2canvas → jsPDF).
 */

export const MAX_SHOPPING_LIST_PDF_TEMPLATES = 15
export const MAX_SHOPPING_LIST_PDF_TEMPLATE_NAME_LEN = 48

export interface ShoppingListPdfLayoutOptions {
  showBrand: boolean
  showDisclaimer: boolean
  showPrintDate: boolean
  showPriceColumns: boolean
  showCheckboxColumn: boolean
  showLineCountFooter: boolean
  showEstimatedSumFooter: boolean
}

export const DEFAULT_SHOPPING_LIST_PDF_LAYOUT: ShoppingListPdfLayoutOptions = {
  showBrand: false,
  showDisclaimer: true,
  showPrintDate: true,
  showPriceColumns: true,
  showCheckboxColumn: true,
  showLineCountFooter: true,
  showEstimatedSumFooter: true,
}

/** Merge partial mot defaults; tvinger meningsfull kombinasjon (sum bare med priskolonner). */
export function mergeShoppingListPdfLayout(partial?: Partial<ShoppingListPdfLayoutOptions> | null): ShoppingListPdfLayoutOptions {
  const base = { ...DEFAULT_SHOPPING_LIST_PDF_LAYOUT, ...partial }
  if (!base.showPriceColumns) {
    base.showEstimatedSumFooter = false
  }
  return base
}

export interface ShoppingListPdfTemplate {
  id: string
  name: string
  createdAt: string
  options: ShoppingListPdfLayoutOptions
}
