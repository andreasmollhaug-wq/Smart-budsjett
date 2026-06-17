import type { GroceryCatalogEntry } from './groceryCatalogTypes'
import { GROCERY_CATALOG } from './groceryCatalog'
import { normalizeProductKey } from './normalizeProductKey'

/** Filtrer katalog for søkestreng (navn eller alias). */
export function filterGroceryCatalog(query: string, limit = 80): GroceryCatalogEntry[] {
  const q = normalizeProductKey(query)
  if (!q) return GROCERY_CATALOG.slice(0, limit)
  const out: GroceryCatalogEntry[] = []
  for (const e of GROCERY_CATALOG) {
    if (out.length >= limit) break
    const hay = normalizeProductKey([e.displayName, ...(e.searchAliases ?? [])].join(' '))
    if (hay.includes(q) || normalizeProductKey(e.displayName).includes(q)) out.push(e)
  }
  return out
}
