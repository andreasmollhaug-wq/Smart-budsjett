export type GroceryCategoryId = 'gronn' | 'meieri' | 'kjott' | 'torr' | 'fryse' | 'drikke' | 'annet'

export interface GroceryCatalogEntry {
  displayName: string
  categoryId: GroceryCategoryId
  unitPriceNok: number
  searchAliases?: string[]
}
