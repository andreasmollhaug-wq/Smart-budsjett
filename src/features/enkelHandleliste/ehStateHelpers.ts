import { normalizeProductKey } from '@/lib/groceries/normalizeProductKey'
import type { EhPersonalProduct, EhProductStat, EnkelHandlelisteState } from './types'
import { MAX_PERSONAL_PRODUCTS as MAX_PERSONAL, MAX_PRODUCT_STATS_KEYS as MAX_STATS } from './types'

export function recordPersonalProductsInState(
  state: EnkelHandlelisteState,
  names: string[],
  profileId: string,
  capitalize: boolean,
  formatName: (raw: string, cap: boolean) => string,
): EhPersonalProduct[] {
  const t = new Date().toISOString()
  const byKey = new Map(state.personalProducts.map((p) => [p.normalizedKey, { ...p }]))

  for (const raw of names) {
    const displayName = formatName(raw, capitalize)
    if (!displayName) continue
    const key = normalizeProductKey(displayName)
    if (!key) continue
    const ex = byKey.get(key)
    if (ex) {
      ex.useCount += 1
      ex.displayName = displayName
      ex.lastUsedAt = t
      ex.lastUsedByProfileId = profileId
    } else {
      byKey.set(key, {
        normalizedKey: key,
        displayName,
        useCount: 1,
        lastUsedAt: t,
        lastUsedByProfileId: profileId,
      })
    }
  }

  return trimPersonalProducts([...byKey.values()])
}

export function trimPersonalProducts(list: EhPersonalProduct[]): EhPersonalProduct[] {
  return [...list]
    .sort((a, b) => b.useCount - a.useCount || b.lastUsedAt.localeCompare(a.lastUsedAt))
    .slice(0, MAX_PERSONAL)
}

export function bumpProductStatsInState(
  state: EnkelHandlelisteState,
  names: string[],
  kind: 'add' | 'check',
  formatName: (raw: string, cap: boolean) => string,
  capitalize: boolean,
): Record<string, EhProductStat> {
  const t = new Date().toISOString()
  const stats = { ...state.productStats }

  for (const raw of names) {
    const displayName = formatName(raw, capitalize)
    if (!displayName) continue
    const key = normalizeProductKey(displayName)
    if (!key) continue
    const ex = stats[key]
    if (ex) {
      stats[key] = {
        ...ex,
        displayName,
        addCount: ex.addCount + (kind === 'add' ? 1 : 0),
        checkCount: ex.checkCount + (kind === 'check' ? 1 : 0),
        lastCheckedAt: kind === 'check' ? t : ex.lastCheckedAt,
      }
    } else {
      stats[key] = {
        normalizedKey: key,
        displayName,
        addCount: kind === 'add' ? 1 : 0,
        checkCount: kind === 'check' ? 1 : 0,
        lastCheckedAt: kind === 'check' ? t : null,
      }
    }
  }

  return trimProductStats(stats)
}

export function trimProductStats(stats: Record<string, EhProductStat>): Record<string, EhProductStat> {
  const entries = Object.entries(stats)
  if (entries.length <= MAX_STATS) return stats
  const sorted = entries.sort(
    (a, b) =>
      b[1].checkCount + b[1].addCount - (a[1].checkCount + a[1].addCount) ||
      (b[1].lastCheckedAt ?? '').localeCompare(a[1].lastCheckedAt ?? ''),
  )
  return Object.fromEntries(sorted.slice(0, MAX_STATS))
}

export function mergePersonalProducts(
  local: EhPersonalProduct[],
  remote: EhPersonalProduct[],
): EhPersonalProduct[] {
  const byKey = new Map<string, EhPersonalProduct>()
  for (const p of [...local, ...remote]) {
    const ex = byKey.get(p.normalizedKey)
    if (!ex) {
      byKey.set(p.normalizedKey, { ...p })
      continue
    }
    const newer = p.lastUsedAt >= ex.lastUsedAt ? p : ex
    byKey.set(p.normalizedKey, {
      normalizedKey: p.normalizedKey,
      displayName: newer.displayName,
      useCount: ex.useCount + p.useCount,
      lastUsedAt: newer.lastUsedAt,
      lastUsedByProfileId: newer.lastUsedByProfileId,
    })
  }
  return trimPersonalProducts([...byKey.values()])
}

export function mergeProductStats(
  local: Record<string, EhProductStat>,
  remote: Record<string, EhProductStat>,
): Record<string, EhProductStat> {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)])
  const out: Record<string, EhProductStat> = {}
  for (const key of keys) {
    const l = local[key]
    const r = remote[key]
    if (!l && r) {
      out[key] = { ...r }
      continue
    }
    if (l && !r) {
      out[key] = { ...l }
      continue
    }
    if (!l || !r) continue
    const newer = (r.lastCheckedAt ?? '') > (l.lastCheckedAt ?? '') ? r : l
    out[key] = {
      normalizedKey: key,
      displayName: newer.displayName,
      addCount: l.addCount + r.addCount,
      checkCount: l.checkCount + r.checkCount,
      lastCheckedAt:
        l.lastCheckedAt && r.lastCheckedAt
          ? l.lastCheckedAt > r.lastCheckedAt
            ? l.lastCheckedAt
            : r.lastCheckedAt
          : l.lastCheckedAt ?? r.lastCheckedAt,
    }
  }
  return trimProductStats(out)
}
