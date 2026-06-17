import { mergePersonalProducts, mergeProductStats } from './ehStateHelpers'
import { normalizeEnkelHandlelisteState } from './normalize'
import type { EhActivity, EhGroup, EhItem, EhList, EhTemplate, EnkelHandlelisteState } from './types'
import { ENKEL_HANDLELISTE_ACTIVITY_MAX } from './types'

function pickNewer<T extends { id: string; updatedAt: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>()
  for (const r of remote) byId.set(r.id, r)
  for (const l of local) {
    const ex = byId.get(l.id)
    if (!ex || l.updatedAt > ex.updatedAt) byId.set(l.id, l)
  }
  return [...byId.values()]
}

function mergeActivity(local: EhActivity[], remote: EhActivity[]): EhActivity[] {
  const byId = new Map<string, EhActivity>()
  for (const a of [...local, ...remote]) {
    const ex = byId.get(a.id)
    if (!ex || a.at > ex.at) byId.set(a.id, a)
  }
  return [...byId.values()].sort((a, b) => (a.at < b.at ? 1 : -1))
}

/** Slår sammen lokal og remote tilstand (nyeste updatedAt vinner per id). */
export function mergeRemoteState(
  local: EnkelHandlelisteState,
  remote: unknown,
): EnkelHandlelisteState {
  const r = normalizeEnkelHandlelisteState(remote)
  const groups = pickNewer<EhGroup>(local.groups, r.groups).sort((a, b) => a.sortOrder - b.sortOrder)
  const lists = pickNewer<EhList>(local.lists, r.lists).sort((a, b) => a.sortOrder - b.sortOrder)
  const items = pickNewer<EhItem>(local.items, r.items)
  const listIds = new Set(lists.map((l) => l.id))
  const filteredItems = items.filter((it) => listIds.has(it.listId))
  const templates = pickNewer<EhTemplate>(local.templates, r.templates).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )

  const localSettingsAt = local.lists[0]?.updatedAt ?? ''
  const remoteSettingsAt = r.lists[0]?.updatedAt ?? ''
  const settings =
    remoteSettingsAt > localSettingsAt
      ? { ...local.settings, ...r.settings }
      : { ...r.settings, ...local.settings }

  return {
    version: Math.max(local.version, r.version),
    groups,
    lists,
    items: filteredItems,
    settings,
    activity: mergeActivity(local.activity, r.activity).slice(0, ENKEL_HANDLELISTE_ACTIVITY_MAX),
    templates,
    personalProducts: mergePersonalProducts(local.personalProducts, r.personalProducts),
    productStats: mergeProductStats(local.productStats, r.productStats),
  }
}
