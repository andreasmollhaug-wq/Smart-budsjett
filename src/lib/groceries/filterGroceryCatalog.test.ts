import { describe, expect, it } from 'vitest'
import { filterGroceryCatalog } from './filterGroceryCatalog'
import { GROCERY_CATALOG } from './groceryCatalog'

describe('filterGroceryCatalog', () => {
  it('har forventet størrelse', () => {
    expect(GROCERY_CATALOG.length).toBeGreaterThanOrEqual(220)
    expect(GROCERY_CATALOG.length).toBeLessThanOrEqual(350)
  })

  it('spotcheck standardvarer', () => {
    const names = new Set(GROCERY_CATALOG.map((e) => e.displayName))
    expect(names.has('Banan')).toBe(true)
    expect(names.has('Eple')).toBe(true)
    expect(names.has('Brød')).toBe(true)
    expect(names.has('Tomat')).toBe(true)
    expect(names.has('Lettmelk') || names.has('Helmelk')).toBe(true)
  })

  it('me treffer melk', () => {
    const hits = filterGroceryCatalog('me', 20)
    expect(hits.some((h) => h.displayName.toLowerCase().includes('melk'))).toBe(true)
  })
})
