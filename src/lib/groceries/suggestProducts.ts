import { filterGroceryCatalog } from './filterGroceryCatalog'
import { GROCERY_CATALOG } from './groceryCatalog'
import type { GroceryCatalogEntry } from './groceryCatalogTypes'
import { normalizeProductKey } from './normalizeProductKey'
import { QUICK_PICKS } from './quickPicks'

export interface PersonalProductInput {
  normalizedKey: string
  displayName: string
  useCount: number
  lastUsedAt: string
}

export interface SuggestResult {
  displayName: string
  normalizedKey: string
  source: 'personal' | 'catalog' | 'quick'
  score: number
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function scorePersonal(p: PersonalProductInput, q: string): number {
  let score = 0
  if (p.normalizedKey === q) score += 50
  else if (p.normalizedKey.startsWith(q)) score += 30
  else if (normalizeProductKey(p.displayName).includes(q)) score += 15
  score += Math.min(10, p.useCount)
  if (Date.now() - Date.parse(p.lastUsedAt) < SEVEN_DAYS_MS) score += 5
  return score
}

function scoreCatalog(e: GroceryCatalogEntry, q: string): number {
  const hay = normalizeProductKey([e.displayName, ...(e.searchAliases ?? [])].join(' '))
  if (!hay.includes(q) && !normalizeProductKey(e.displayName).includes(q)) return 0
  let score = 20
  if (normalizeProductKey(e.displayName).startsWith(q)) score += 5
  return score
}

function catalogByName(name: string): GroceryCatalogEntry | undefined {
  const n = normalizeProductKey(name)
  return GROCERY_CATALOG.find(
    (e) =>
      normalizeProductKey(e.displayName) === n ||
      (e.searchAliases ?? []).some((a) => normalizeProductKey(a) === n),
  )
}

export function suggestProducts(
  query: string,
  personal: PersonalProductInput[],
  options?: { limit?: number },
): SuggestResult[] {
  const limit = options?.limit ?? 8
  const q = normalizeProductKey(query.trim())

  if (!q) {
    const byKey = new Map<string, SuggestResult>()
    const sortedPersonal = [...personal].sort(
      (a, b) => b.useCount - a.useCount || b.lastUsedAt.localeCompare(a.lastUsedAt),
    )
    for (const p of sortedPersonal.slice(0, 5)) {
      byKey.set(p.normalizedKey, {
        displayName: p.displayName,
        normalizedKey: p.normalizedKey,
        source: 'personal',
        score: 100,
      })
    }
    for (const name of QUICK_PICKS) {
      if (byKey.size >= limit) break
      const cat = catalogByName(name)
      const key = normalizeProductKey(name)
      if (!key || byKey.has(key)) continue
      byKey.set(key, {
        displayName: cat?.displayName ?? name,
        normalizedKey: key,
        source: 'quick',
        score: 10,
      })
    }
    return [...byKey.values()].slice(0, limit)
  }

  const byKey = new Map<string, SuggestResult>()

  for (const p of personal) {
    const score = scorePersonal(p, q)
    if (score <= 0) continue
    const ex = byKey.get(p.normalizedKey)
    if (!ex || score > ex.score) {
      byKey.set(p.normalizedKey, {
        displayName: p.displayName,
        normalizedKey: p.normalizedKey,
        source: 'personal',
        score,
      })
    }
  }

  for (const e of filterGroceryCatalog(query, 50)) {
    const key = normalizeProductKey(e.displayName)
    const score = scoreCatalog(e, q)
    if (score <= 0) continue
    const ex = byKey.get(key)
    if (!ex || score > ex.score) {
      byKey.set(key, {
        displayName: e.displayName,
        normalizedKey: key,
        source: 'catalog',
        score,
      })
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName, 'nb'))
    .slice(0, limit)
}
