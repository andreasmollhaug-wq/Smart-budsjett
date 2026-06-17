import {
  createDefaultEhSettings,
  createEmptyEnkelHandlelisteState,
  ENKEL_HANDLELISTE_ACTIVITY_MAX,
  ENKEL_HANDLELISTE_VERSION,
  MAX_GROUPS,
  MAX_ITEMS_PER_LIST,
  MAX_LISTS,
  type EhActivity,
  type EhGroup,
  type EhItem,
  type EhList,
  MAX_PERSONAL_PRODUCTS,
  MAX_PRODUCT_STATS_KEYS,
  MAX_TEMPLATES,
  MAX_TEMPLATE_LINES,
  MAX_TEMPLATE_NAME_LEN,
  type EhPersonalProduct,
  type EhProductStat,
  type EhSettings,
  type EhTemplate,
  type EhLastTab,
  type EnkelHandlelisteState,
} from './types'

function clampStr(s: unknown, max: number): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, max)
}

function isoOrNow(s: unknown): string {
  if (typeof s === 'string' && s.length >= 10) return s
  return new Date().toISOString()
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.min(max, Math.max(min, v))
}

function normalizeSettings(raw: unknown): EhSettings {
  const d = createDefaultEhSettings()
  if (!raw || typeof raw !== 'object') return d
  const o = raw as Record<string, unknown>
  const lastTab = o.lastTab
  const tab: EhLastTab =
    lastTab === 'templates' || lastTab === 'analysis' ? lastTab : 'lists'
  return {
    capitalizeWords: o.capitalizeWords === true,
    showQuantity: o.showQuantity !== false,
    shakeToSortEnabled: o.shakeToSortEnabled !== false,
    defaultGroupId:
      typeof o.defaultGroupId === 'string' && o.defaultGroupId.length > 0 ? o.defaultGroupId : null,
    lastTab: tab,
    showContributorInitials: o.showContributorInitials !== false,
  }
}

function normalizeGroup(raw: unknown, i: number): EhGroup | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = clampStr(o.id, 64)
  if (!id) return null
  return {
    id,
    name: clampStr(o.name, 120) || 'Gruppe',
    sortOrder: clampInt(o.sortOrder, 0, 9999, i),
    createdAt: isoOrNow(o.createdAt),
    updatedAt: isoOrNow(o.updatedAt),
  }
}

function normalizeList(raw: unknown, i: number): EhList | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = clampStr(o.id, 64)
  const ownerProfileId = clampStr(o.ownerProfileId, 64)
  if (!id || !ownerProfileId) return null
  const members: string[] = []
  if (Array.isArray(o.memberProfileIds)) {
    for (const m of o.memberProfileIds) {
      const mid = clampStr(m, 64)
      if (mid && !members.includes(mid)) members.push(mid)
    }
  }
  const groupId =
    typeof o.groupId === 'string' && o.groupId.length > 0 ? clampStr(o.groupId, 64) : null
  const archivedAt =
    typeof o.archivedAt === 'string' && o.archivedAt.length > 0 ? isoOrNow(o.archivedAt) : null
  return {
    id,
    groupId,
    name: clampStr(o.name, 120) || 'Handleliste',
    ownerProfileId,
    memberProfileIds: members,
    sortOrder: clampInt(o.sortOrder, 0, 9999, i),
    archivedAt,
    createdAt: isoOrNow(o.createdAt),
    updatedAt: isoOrNow(o.updatedAt),
  }
}

function normalizeItem(raw: unknown, i: number): EhItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = clampStr(o.id, 64)
  const listId = clampStr(o.listId, 64)
  const addedByProfileId = clampStr(o.addedByProfileId, 64)
  if (!id || !listId || !addedByProfileId) return null
  const qty =
    o.quantity === null || o.quantity === undefined
      ? null
      : clampInt(o.quantity, 0, 99999, 1)
  return {
    id,
    listId,
    name: clampStr(o.name, 200) || 'Vare',
    quantity: qty,
    checked: o.checked === true,
    sortOrder: clampInt(o.sortOrder, 0, 99999, i),
    addedByProfileId,
    addedAt: isoOrNow(o.addedAt),
    updatedAt: isoOrNow(o.updatedAt),
  }
}

function normalizeActivity(raw: unknown): EhActivity | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = clampStr(o.id, 64)
  const type = clampStr(o.type, 40)
  const profileId = clampStr(o.profileId, 64)
  if (!id || !type || !profileId) return null
  const listId =
    typeof o.listId === 'string' && o.listId.length > 0 ? clampStr(o.listId, 64) : null
  return {
    id,
    listId,
    type: type as EhActivity['type'],
    profileId,
    payload: clampStr(o.payload, 500),
    at: isoOrNow(o.at),
  }
}

function normalizeTemplate(raw: unknown, i: number): EhTemplate | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = clampStr(o.id, 64)
  if (!id) return null
  const lines: EhTemplate['lines'] = []
  if (Array.isArray(o.lines)) {
    for (const ln of o.lines.slice(0, MAX_TEMPLATE_LINES)) {
      if (!ln || typeof ln !== 'object') continue
      const lo = ln as Record<string, unknown>
      const name = clampStr(lo.name, 200)
      if (!name) continue
      const qty =
        lo.quantity === null || lo.quantity === undefined
          ? null
          : clampInt(lo.quantity, 0, 99999, 1)
      lines.push({ name, quantity: qty })
    }
  }
  const wd = typeof o.suggestedWeekday === 'number' ? Math.floor(o.suggestedWeekday) : null
  const suggestedWeekday =
    wd !== null && wd >= 0 && wd <= 6 ? wd : null
  return {
    id,
    name: clampStr(o.name, MAX_TEMPLATE_NAME_LEN) || 'Mal',
    lines,
    suggestedWeekday,
    sortOrder: clampInt(o.sortOrder, 0, 9999, i),
    createdAt: isoOrNow(o.createdAt),
    updatedAt: isoOrNow(o.updatedAt),
  }
}

function normalizePersonal(raw: unknown): EhPersonalProduct | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const normalizedKey = clampStr(o.normalizedKey, 200)
  if (!normalizedKey) return null
  return {
    normalizedKey,
    displayName: clampStr(o.displayName, 200) || normalizedKey,
    useCount: clampInt(o.useCount, 1, 999999, 1),
    lastUsedAt: isoOrNow(o.lastUsedAt),
    lastUsedByProfileId:
      typeof o.lastUsedByProfileId === 'string' && o.lastUsedByProfileId.length > 0
        ? clampStr(o.lastUsedByProfileId, 64)
        : null,
  }
}

function normalizeProductStat(key: string, raw: unknown): EhProductStat | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  return {
    normalizedKey: key,
    displayName: clampStr(o.displayName, 200) || key,
    addCount: clampInt(o.addCount, 0, 999999, 0),
    checkCount: clampInt(o.checkCount, 0, 999999, 0),
    lastCheckedAt:
      typeof o.lastCheckedAt === 'string' && o.lastCheckedAt.length > 0
        ? isoOrNow(o.lastCheckedAt)
        : null,
  }
}

export function normalizeEnkelHandlelisteState(raw: unknown): EnkelHandlelisteState {
  if (!raw || typeof raw !== 'object') return createEmptyEnkelHandlelisteState()
  const o = raw as Record<string, unknown>

  const groups: EhGroup[] = []
  if (Array.isArray(o.groups)) {
    o.groups.slice(0, MAX_GROUPS).forEach((g, i) => {
      const n = normalizeGroup(g, i)
      if (n) groups.push(n)
    })
  }
  groups.sort((a, b) => a.sortOrder - b.sortOrder)

  const lists: EhList[] = []
  if (Array.isArray(o.lists)) {
    o.lists.slice(0, MAX_LISTS).forEach((l, i) => {
      const n = normalizeList(l, i)
      if (n) lists.push(n)
    })
  }
  lists.sort((a, b) => a.sortOrder - b.sortOrder)

  const listIds = new Set(lists.map((l) => l.id))
  const items: EhItem[] = []
  if (Array.isArray(o.items)) {
    o.items.slice(0, MAX_LISTS * MAX_ITEMS_PER_LIST).forEach((it, i) => {
      const n = normalizeItem(it, i)
      if (n && listIds.has(n.listId)) items.push(n)
    })
  }

  const activity: EhActivity[] = []
  if (Array.isArray(o.activity)) {
    for (const a of o.activity) {
      const n = normalizeActivity(a)
      if (n) activity.push(n)
    }
  }
  activity.sort((a, b) => (a.at < b.at ? 1 : -1))
  const trimmedActivity = activity.slice(0, ENKEL_HANDLELISTE_ACTIVITY_MAX)

  const templates: EhTemplate[] = []
  if (Array.isArray(o.templates)) {
    o.templates.slice(0, MAX_TEMPLATES).forEach((t, i) => {
      const n = normalizeTemplate(t, i)
      if (n) templates.push(n)
    })
  }
  templates.sort((a, b) => a.sortOrder - b.sortOrder)

  const personalByKey = new Map<string, EhPersonalProduct>()
  if (Array.isArray(o.personalProducts)) {
    for (const p of o.personalProducts) {
      const n = normalizePersonal(p)
      if (!n) continue
      const ex = personalByKey.get(n.normalizedKey)
      if (!ex || n.useCount >= ex.useCount) personalByKey.set(n.normalizedKey, n)
    }
  }
  const personalProducts = [...personalByKey.values()]
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, MAX_PERSONAL_PRODUCTS)

  const productStats: Record<string, EhProductStat> = {}
  if (o.productStats && typeof o.productStats === 'object' && !Array.isArray(o.productStats)) {
    for (const [k, v] of Object.entries(o.productStats as Record<string, unknown>)) {
      if (Object.keys(productStats).length >= MAX_PRODUCT_STATS_KEYS) break
      const key = clampStr(k, 200)
      if (!key) continue
      const n = normalizeProductStat(key, v)
      if (n) productStats[key] = n
    }
  }

  return {
    version: ENKEL_HANDLELISTE_VERSION,
    groups,
    lists,
    items,
    settings: normalizeSettings(o.settings),
    activity: trimmedActivity,
    templates,
    personalProducts,
    productStats,
  }
}
