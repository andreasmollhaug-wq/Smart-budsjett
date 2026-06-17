import { create } from 'zustand'
import { formatItemName } from './parseCommaInput'
import { defaultMemberProfileIds } from './familyGate'
import {
  bumpProductStatsInState,
  recordPersonalProductsInState,
} from './ehStateHelpers'
import {
  createEmptyEnkelHandlelisteState,
  ENKEL_HANDLELISTE_ACTIVITY_MAX,
  MAX_TEMPLATES,
  MAX_TEMPLATE_LINES,
  MAX_TEMPLATE_NAME_LEN,
  type EhActivity,
  type EhItem,
  type EhList,
  type EhSettings,
  type EhTemplate,
  type EhTemplateLine,
  type EnkelHandlelisteState,
} from './types'
import { mergeRemoteState } from './mergeRemoteState'
import { generateId } from '@/lib/utils'

export type EhMutationResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'limit' | 'invalid' | 'household_readonly' }

type Store = EnkelHandlelisteState & {
  _hydrated: boolean
  hydrate: (state: EnkelHandlelisteState) => void
  mergeFromRemote: (remote: EnkelHandlelisteState) => void
  getPersistedSlice: () => EnkelHandlelisteState

  ehAddGroup: (name: string, profileId: string) => EhMutationResult & { id?: string }
  ehRenameGroup: (groupId: string, name: string) => EhMutationResult
  ehDeleteGroup: (groupId: string) => EhMutationResult
  ehReorderGroups: (groupIds: string[]) => EhMutationResult

  ehCreateList: (
    input: {
      name: string
      groupId: string | null
      ownerProfileId: string
      allProfileIds: string[]
      familyEnabled: boolean
    },
  ) => EhMutationResult & { id?: string }
  ehRenameList: (listId: string, name: string, profileId: string) => EhMutationResult
  ehArchiveList: (listId: string, profileId: string) => EhMutationResult
  ehUnarchiveList: (listId: string, profileId: string) => EhMutationResult
  ehDeleteList: (listId: string, profileId: string) => EhMutationResult
  ehMoveListToGroup: (listId: string, groupId: string | null, profileId: string) => EhMutationResult
  ehReorderLists: (listIds: string[], groupId: string | null) => EhMutationResult
  ehSetListMembers: (listId: string, memberProfileIds: string[], profileId: string) => EhMutationResult
  ehTransferListOwnership: (listId: string, newOwnerProfileId: string, profileId: string) => EhMutationResult

  ehAddItems: (
    listId: string,
    names: string[],
    profileId: string,
    capitalize: boolean,
  ) => EhMutationResult & { added?: number }
  ehToggleItem: (itemId: string, profileId: string) => EhMutationResult
  ehPatchItem: (
    itemId: string,
    patch: { name?: string; quantity?: number | null },
    profileId: string,
  ) => EhMutationResult
  ehRemoveItem: (itemId: string, profileId: string) => EhMutationResult
  ehReorderItems: (listId: string, itemIds: string[], profileId: string) => EhMutationResult
  ehSortCheckedToBottom: (listId: string, profileId: string) => EhMutationResult
  ehClearCheckedItems: (listId: string, profileId: string) => EhMutationResult
  ehClearAllItems: (listId: string, profileId: string) => EhMutationResult
  ehCopyListContent: (
    sourceListId: string,
    targetListId: string,
    mode: 'merge' | 'replace',
    profileId: string,
  ) => EhMutationResult

  ehCreateTemplate: (input: {
    name: string
    lines: EhTemplateLine[]
    suggestedWeekday?: number | null
    profileId: string
  }) => EhMutationResult & { id?: string }
  ehUpdateTemplate: (
    templateId: string,
    patch: Partial<Pick<EhTemplate, 'name' | 'lines' | 'suggestedWeekday' | 'sortOrder'>>,
    profileId: string,
  ) => EhMutationResult
  ehDeleteTemplate: (templateId: string, profileId: string) => EhMutationResult
  ehApplyTemplate: (
    templateId: string,
    targetListId: string,
    mode: 'merge' | 'replace',
    profileId: string,
  ) => EhMutationResult
  ehCreateTemplateFromList: (
    listId: string,
    name: string,
    profileId: string,
    includeChecked?: boolean,
  ) => EhMutationResult & { id?: string }
  ehReorderTemplates: (templateIds: string[]) => EhMutationResult

  ehPatchSettings: (patch: Partial<EhSettings>) => void
}

function withCatalogSideEffects(
  state: EnkelHandlelisteState,
  names: string[],
  profileId: string,
  capitalize: boolean,
  kind: 'add' | 'check',
): Pick<EnkelHandlelisteState, 'personalProducts' | 'productStats'> {
  return {
    personalProducts:
      kind === 'add'
        ? recordPersonalProductsInState(state, names, profileId, capitalize, formatItemName)
        : state.personalProducts,
    productStats: bumpProductStatsInState(state, names, kind, formatItemName, capitalize),
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function pushActivity(
  activity: EhActivity[],
  entry: Omit<EhActivity, 'id' | 'at'> & { at?: string },
): EhActivity[] {
  const ev: EhActivity = {
    id: generateId(),
    at: entry.at ?? nowIso(),
    listId: entry.listId,
    type: entry.type,
    profileId: entry.profileId,
    payload: entry.payload.slice(0, 500),
  }
  return [ev, ...activity].slice(0, ENKEL_HANDLELISTE_ACTIVITY_MAX)
}

function getList(state: EnkelHandlelisteState, listId: string): EhList | undefined {
  return state.lists.find((l) => l.id === listId)
}

function canEdit(
  list: EhList,
  profileId: string,
): boolean {
  if (list.ownerProfileId === profileId) return true
  return list.memberProfileIds.includes(profileId)
}

function canRemoveItem(list: EhList, item: EhItem, profileId: string): boolean {
  if (list.ownerProfileId === profileId) return true
  return item.addedByProfileId === profileId
}

function nextItemSortOrder(items: EhItem[], listId: string): number {
  const listItems = items.filter((i) => i.listId === listId)
  if (!listItems.length) return 0
  return Math.max(...listItems.map((i) => i.sortOrder)) + 1
}

export const useEnkelHandlelisteStore = create<Store>((set, get) => ({
  ...createEmptyEnkelHandlelisteState(),
  _hydrated: false,

  hydrate: (state) => set({ ...state, _hydrated: true }),

  mergeFromRemote: (remote) => {
    set((s) => ({ ...mergeRemoteState(s, remote), _hydrated: true }))
  },

  getPersistedSlice: () => {
    const s = get()
    return {
      version: s.version,
      groups: s.groups,
      lists: s.lists,
      items: s.items,
      settings: s.settings,
      activity: s.activity,
      templates: s.templates,
      personalProducts: s.personalProducts,
      productStats: s.productStats,
    }
  },

  ehAddGroup: (name, profileId) => {
    const state = get()
    if (state.groups.length >= 50) return { ok: false, reason: 'limit' }
    const trimmed = name.trim().slice(0, 120)
    if (!trimmed) return { ok: false, reason: 'invalid' }
    const id = generateId()
    const t = nowIso()
    const sortOrder = state.groups.length
    set({
      groups: [
        ...state.groups,
        { id, name: trimmed, sortOrder, createdAt: t, updatedAt: t },
      ],
      activity: pushActivity(state.activity, {
        listId: null,
        type: 'list_created',
        profileId,
        payload: `Gruppe: ${trimmed}`,
      }),
    })
    return { ok: true, id }
  },

  ehRenameGroup: (groupId, name) => {
    const trimmed = name.trim().slice(0, 120)
    if (!trimmed) return { ok: false, reason: 'invalid' }
    const state = get()
    const g = state.groups.find((x) => x.id === groupId)
    if (!g) return { ok: false, reason: 'not_found' }
    const t = nowIso()
    set({
      groups: state.groups.map((x) =>
        x.id === groupId ? { ...x, name: trimmed, updatedAt: t } : x,
      ),
    })
    return { ok: true }
  },

  ehDeleteGroup: (groupId) => {
    const state = get()
    if (!state.groups.some((g) => g.id === groupId)) return { ok: false, reason: 'not_found' }
    set({
      groups: state.groups.filter((g) => g.id !== groupId),
      lists: state.lists.map((l) =>
        l.groupId === groupId ? { ...l, groupId: null, updatedAt: nowIso() } : l,
      ),
    })
    return { ok: true }
  },

  ehReorderGroups: (groupIds) => {
    const state = get()
    const order = new Map(groupIds.map((id, i) => [id, i]))
    const t = nowIso()
    set({
      groups: state.groups
        .map((g) => ({
          ...g,
          sortOrder: order.has(g.id) ? order.get(g.id)! : g.sortOrder + 1000,
          updatedAt: t,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })
    return { ok: true }
  },

  ehCreateList: (input) => {
    const state = get()
    if (state.lists.length >= 200) return { ok: false, reason: 'limit' }
    const trimmed = input.name.trim().slice(0, 120)
    if (!trimmed) return { ok: false, reason: 'invalid' }
    const id = generateId()
    const t = nowIso()
    const memberProfileIds = input.familyEnabled
      ? defaultMemberProfileIds(input.ownerProfileId, input.allProfileIds)
      : []
    const groupLists = state.lists.filter((l) => l.groupId === input.groupId && !l.archivedAt)
    const sortOrder = groupLists.length
    const list: EhList = {
      id,
      groupId: input.groupId,
      name: trimmed,
      ownerProfileId: input.ownerProfileId,
      memberProfileIds,
      sortOrder,
      archivedAt: null,
      createdAt: t,
      updatedAt: t,
    }
    set({
      lists: [...state.lists, list],
      activity: pushActivity(state.activity, {
        listId: id,
        type: 'list_created',
        profileId: input.ownerProfileId,
        payload: trimmed,
      }),
    })
    return { ok: true, id }
  },

  ehRenameList: (listId, name, profileId) => {
    const trimmed = name.trim().slice(0, 120)
    if (!trimmed) return { ok: false, reason: 'invalid' }
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    const t = nowIso()
    set({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, name: trimmed, updatedAt: t } : l,
      ),
    })
    return { ok: true }
  },

  ehArchiveList: (listId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    const t = nowIso()
    set({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, archivedAt: t, updatedAt: t } : l,
      ),
      activity: pushActivity(state.activity, {
        listId,
        type: 'list_archived',
        profileId,
        payload: list.name,
      }),
    })
    return { ok: true }
  },

  ehUnarchiveList: (listId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    const t = nowIso()
    set({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, archivedAt: null, updatedAt: t } : l,
      ),
    })
    return { ok: true }
  },

  ehDeleteList: (listId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    set({
      lists: state.lists.filter((l) => l.id !== listId),
      items: state.items.filter((i) => i.listId !== listId),
      activity: pushActivity(state.activity, {
        listId: null,
        type: 'list_deleted',
        profileId,
        payload: list.name,
      }),
    })
    return { ok: true }
  },

  ehMoveListToGroup: (listId, groupId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    if (groupId && !state.groups.some((g) => g.id === groupId)) {
      return { ok: false, reason: 'not_found' }
    }
    const t = nowIso()
    const sortOrder = state.lists.filter((l) => l.groupId === groupId && !l.archivedAt).length
    set({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, groupId, sortOrder, updatedAt: t } : l,
      ),
    })
    return { ok: true }
  },

  ehReorderLists: (listIds, groupId) => {
    const state = get()
    const order = new Map(listIds.map((id, i) => [id, i]))
    const t = nowIso()
    set({
      lists: state.lists
        .map((l) => {
          if (l.groupId !== groupId) return l
          return {
            ...l,
            sortOrder: order.has(l.id) ? order.get(l.id)! : l.sortOrder + 1000,
            updatedAt: t,
          }
        })
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })
    return { ok: true }
  },

  ehSetListMembers: (listId, memberProfileIds, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    const unique = [...new Set(memberProfileIds.filter((id) => id !== list.ownerProfileId))]
    const t = nowIso()
    set({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, memberProfileIds: unique, updatedAt: t } : l,
      ),
      activity: pushActivity(state.activity, {
        listId,
        type: 'member_updated',
        profileId,
        payload: unique.join(','),
      }),
    })
    return { ok: true }
  },

  ehTransferListOwnership: (listId, newOwnerProfileId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    if (!newOwnerProfileId || newOwnerProfileId === list.ownerProfileId) {
      return { ok: false, reason: 'invalid' }
    }
    const t = nowIso()
    const members = list.memberProfileIds.filter((id) => id !== newOwnerProfileId)
    if (!members.includes(list.ownerProfileId)) members.push(list.ownerProfileId)
    set({
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              ownerProfileId: newOwnerProfileId,
              memberProfileIds: members,
              updatedAt: t,
            }
          : l,
      ),
    })
    return { ok: true }
  },

  ehAddItems: (listId, names, profileId, capitalize) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (!canEdit(list, profileId)) return { ok: false, reason: 'forbidden' }
    const listItems = state.items.filter((i) => i.listId === listId)
    if (listItems.length + names.length > 500) return { ok: false, reason: 'limit' }
    const t = nowIso()
    let sort = nextItemSortOrder(state.items, listId)
    const newItems: EhItem[] = []
    for (const raw of names) {
      const name = formatItemName(raw, capitalize)
      if (!name) continue
      newItems.push({
        id: generateId(),
        listId,
        name,
        quantity: null,
        checked: false,
        sortOrder: sort++,
        addedByProfileId: profileId,
        addedAt: t,
        updatedAt: t,
      })
    }
    if (!newItems.length) return { ok: false, reason: 'invalid' }
    const addedNames = newItems.map((i) => i.name)
    const side = withCatalogSideEffects(state, addedNames, profileId, capitalize, 'add')
    set({
      items: [...state.items, ...newItems],
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, updatedAt: t } : l,
      ),
      activity: pushActivity(state.activity, {
        listId,
        type: 'item_added',
        profileId,
        payload: `${newItems.length} varer`,
      }),
      ...side,
    })
    return { ok: true, added: newItems.length }
  },

  ehToggleItem: (itemId, profileId) => {
    const state = get()
    const item = state.items.find((i) => i.id === itemId)
    if (!item) return { ok: false, reason: 'not_found' }
    const list = getList(state, item.listId)
    if (!list || !canEdit(list, profileId)) return { ok: false, reason: 'forbidden' }
    const t = nowIso()
    const nextChecked = !item.checked
    const side =
      nextChecked
        ? withCatalogSideEffects(state, [item.name], profileId, state.settings.capitalizeWords, 'check')
        : {}
    set({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, checked: nextChecked, updatedAt: t } : i,
      ),
      ...side,
    })
    return { ok: true }
  },

  ehPatchItem: (itemId, patch, profileId) => {
    const state = get()
    const item = state.items.find((i) => i.id === itemId)
    if (!item) return { ok: false, reason: 'not_found' }
    const list = getList(state, item.listId)
    if (!list || !canEdit(list, profileId)) return { ok: false, reason: 'forbidden' }
    if (list.ownerProfileId !== profileId && item.addedByProfileId !== profileId) {
      return { ok: false, reason: 'forbidden' }
    }
    const t = nowIso()
    const newName =
      patch.name !== undefined ? patch.name.trim().slice(0, 200) || item.name : item.name
    const side =
      patch.name !== undefined
        ? withCatalogSideEffects(
            state,
            [newName],
            profileId,
            state.settings.capitalizeWords,
            'add',
          )
        : {}
    set({
      items: state.items.map((i) => {
        if (i.id !== itemId) return i
        return {
          ...i,
          name: newName,
          quantity:
            patch.quantity !== undefined
              ? patch.quantity === null
                ? null
                : Math.max(0, Math.min(99999, Math.floor(patch.quantity)))
              : i.quantity,
          updatedAt: t,
        }
      }),
      ...side,
    })
    return { ok: true }
  },

  ehRemoveItem: (itemId, profileId) => {
    const state = get()
    const item = state.items.find((i) => i.id === itemId)
    if (!item) return { ok: false, reason: 'not_found' }
    const list = getList(state, item.listId)
    if (!list || !canRemoveItem(list, item, profileId)) {
      return { ok: false, reason: 'forbidden' }
    }
    set({
      items: state.items.filter((i) => i.id !== itemId),
      activity: pushActivity(state.activity, {
        listId: item.listId,
        type: 'item_removed',
        profileId,
        payload: item.name,
      }),
    })
    return { ok: true }
  },

  ehReorderItems: (listId, itemIds, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list || !canEdit(list, profileId)) return { ok: false, reason: 'forbidden' }
    const order = new Map(itemIds.map((id, i) => [id, i]))
    const t = nowIso()
    set({
      items: state.items.map((i) => {
        if (i.listId !== listId) return i
        return {
          ...i,
          sortOrder: order.has(i.id) ? order.get(i.id)! : i.sortOrder + 1000,
          updatedAt: t,
        }
      }),
    })
    return { ok: true }
  },

  ehSortCheckedToBottom: (listId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list || !canEdit(list, profileId)) return { ok: false, reason: 'forbidden' }
    const listItems = state.items
      .filter((i) => i.listId === listId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const unchecked = listItems.filter((i) => !i.checked)
    const checked = listItems.filter((i) => i.checked)
    const ordered = [...unchecked, ...checked]
    const t = nowIso()
    const orderMap = new Map(ordered.map((it, idx) => [it.id, idx]))
    set({
      items: state.items.map((i) => {
        if (i.listId !== listId) return i
        return {
          ...i,
          sortOrder: orderMap.get(i.id) ?? i.sortOrder,
          updatedAt: t,
        }
      }),
    })
    return { ok: true }
  },

  ehClearCheckedItems: (listId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list || !canEdit(list, profileId)) return { ok: false, reason: 'forbidden' }
    const toRemove = state.items.filter((i) => i.listId === listId && i.checked)
    if (!toRemove.length) return { ok: true }
    const canRemoveAll = toRemove.every((it) => canRemoveItem(list, it, profileId))
    if (!canRemoveAll && list.ownerProfileId !== profileId) {
      return { ok: false, reason: 'forbidden' }
    }
    const removeIds = new Set(toRemove.map((i) => i.id))
    set({
      items: state.items.filter((i) => !removeIds.has(i.id)),
    })
    return { ok: true }
  },

  ehClearAllItems: (listId, profileId) => {
    const state = get()
    const list = getList(state, listId)
    if (!list || list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    set({
      items: state.items.filter((i) => i.listId !== listId),
    })
    return { ok: true }
  },

  ehCopyListContent: (sourceListId, targetListId, mode, profileId) => {
    const state = get()
    const source = getList(state, sourceListId)
    const target = getList(state, targetListId)
    if (!source || !target) return { ok: false, reason: 'not_found' }
    if (!canEdit(target, profileId)) return { ok: false, reason: 'forbidden' }
    const sourceItems = state.items
      .filter((i) => i.listId === sourceListId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const t = nowIso()
    const baseItems =
      mode === 'replace'
        ? state.items.filter((i) => i.listId !== targetListId)
        : [...state.items]
    let sort = nextItemSortOrder(baseItems, targetListId)
    const copied: EhItem[] = sourceItems.map((src) => ({
      id: generateId(),
      listId: targetListId,
      name: src.name,
      quantity: src.quantity,
      checked: false,
      sortOrder: sort++,
      addedByProfileId: profileId,
      addedAt: t,
      updatedAt: t,
    }))
    if (baseItems.filter((i) => i.listId === targetListId).length + copied.length > 500) {
      return { ok: false, reason: 'limit' }
    }
    const side = withCatalogSideEffects(
      state,
      copied.map((c) => c.name),
      profileId,
      state.settings.capitalizeWords,
      'add',
    )
    set({
      items: [...baseItems, ...copied],
      lists: state.lists.map((l) =>
        l.id === targetListId ? { ...l, updatedAt: t } : l,
      ),
      ...side,
    })
    return { ok: true }
  },

  ehCreateTemplate: (input) => {
    const state = get()
    if (state.templates.length >= MAX_TEMPLATES) return { ok: false, reason: 'limit' }
    const trimmed = input.name.trim().slice(0, MAX_TEMPLATE_NAME_LEN)
    if (!trimmed) return { ok: false, reason: 'invalid' }
    const lines = input.lines
      .map((l) => ({
        name: l.name.trim().slice(0, 200),
        quantity: l.quantity,
      }))
      .filter((l) => l.name)
      .slice(0, MAX_TEMPLATE_LINES)
    if (!lines.length) return { ok: false, reason: 'invalid' }
    const id = generateId()
    const t = nowIso()
    const wd = input.suggestedWeekday
    const suggestedWeekday =
      typeof wd === 'number' && wd >= 0 && wd <= 6 ? Math.floor(wd) : null
    const template: EhTemplate = {
      id,
      name: trimmed,
      lines,
      suggestedWeekday,
      sortOrder: state.templates.length,
      createdAt: t,
      updatedAt: t,
    }
    set({ templates: [...state.templates, template] })
    return { ok: true, id }
  },

  ehUpdateTemplate: (templateId, patch, _profileId) => {
    const state = get()
    const tpl = state.templates.find((x) => x.id === templateId)
    if (!tpl) return { ok: false, reason: 'not_found' }
    const t = nowIso()
    set({
      templates: state.templates.map((x) => {
        if (x.id !== templateId) return x
        return {
          ...x,
          name:
            patch.name !== undefined
              ? patch.name.trim().slice(0, MAX_TEMPLATE_NAME_LEN) || x.name
              : x.name,
          lines: patch.lines !== undefined ? patch.lines.slice(0, MAX_TEMPLATE_LINES) : x.lines,
          suggestedWeekday:
            patch.suggestedWeekday !== undefined ? patch.suggestedWeekday : x.suggestedWeekday,
          sortOrder: patch.sortOrder !== undefined ? patch.sortOrder : x.sortOrder,
          updatedAt: t,
        }
      }),
    })
    return { ok: true }
  },

  ehDeleteTemplate: (templateId, _profileId) => {
    const state = get()
    if (!state.templates.some((x) => x.id === templateId)) return { ok: false, reason: 'not_found' }
    set({ templates: state.templates.filter((x) => x.id !== templateId) })
    return { ok: true }
  },

  ehApplyTemplate: (templateId, targetListId, mode, profileId) => {
    const state = get()
    const tpl = state.templates.find((x) => x.id === templateId)
    if (!tpl) return { ok: false, reason: 'not_found' }
    const target = getList(state, targetListId)
    if (!target || !canEdit(target, profileId)) return { ok: false, reason: 'forbidden' }
    const names = tpl.lines.map((l) => l.name)
    if (mode === 'replace') {
      const cleared = state.items.filter((i) => i.listId !== targetListId)
      set({ items: cleared })
      return get().ehAddItems(targetListId, names, profileId, state.settings.capitalizeWords)
    }
    return get().ehAddItems(targetListId, names, profileId, state.settings.capitalizeWords)
  },

  ehCreateTemplateFromList: (listId, name, profileId, includeChecked = false) => {
    const state = get()
    const list = getList(state, listId)
    if (!list) return { ok: false, reason: 'not_found' }
    if (list.ownerProfileId !== profileId) return { ok: false, reason: 'forbidden' }
    const lines: EhTemplateLine[] = state.items
      .filter((i) => i.listId === listId && (includeChecked || !i.checked))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ name: i.name, quantity: i.quantity }))
    return get().ehCreateTemplate({
      name,
      lines,
      profileId,
    })
  },

  ehReorderTemplates: (templateIds) => {
    const state = get()
    const order = new Map(templateIds.map((id, i) => [id, i]))
    const t = nowIso()
    set({
      templates: state.templates
        .map((x) => ({
          ...x,
          sortOrder: order.has(x.id) ? order.get(x.id)! : x.sortOrder + 1000,
          updatedAt: t,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })
    return { ok: true }
  },

  ehPatchSettings: (patch) => {
    set((s) => ({
      settings: {
        ...s.settings,
        ...patch,
      },
    }))
  },
}))
