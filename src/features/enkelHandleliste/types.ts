/**
 * Enkel handleliste — adskilt modul (Min Handleliste-lignende).
 * Ingen import av mat-handleliste eller transaksjoner.
 */

export const ENKEL_HANDLELISTE_VERSION = 2
export const ENKEL_HANDLELISTE_ACTIVITY_MAX = 100
export const MAX_GROUPS = 50
export const MAX_LISTS = 200
export const MAX_ITEMS_PER_LIST = 500
export const MAX_TEMPLATES = 30
export const MAX_TEMPLATE_LINES = 120
export const MAX_TEMPLATE_NAME_LEN = 80
export const MAX_PERSONAL_PRODUCTS = 500
export const MAX_PRODUCT_STATS_KEYS = 1000

export type EhLastTab = 'lists' | 'templates' | 'analysis'

export interface EhGroup {
  id: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface EhList {
  id: string
  groupId: string | null
  name: string
  ownerProfileId: string
  memberProfileIds: string[]
  sortOrder: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface EhItem {
  id: string
  listId: string
  name: string
  quantity: number | null
  checked: boolean
  sortOrder: number
  addedByProfileId: string
  addedAt: string
  updatedAt: string
}

export interface EhSettings {
  capitalizeWords: boolean
  showQuantity: boolean
  shakeToSortEnabled: boolean
  defaultGroupId: string | null
  lastTab: EhLastTab
  showContributorInitials: boolean
}

export interface EhTemplateLine {
  name: string
  quantity: number | null
}

export interface EhTemplate {
  id: string
  name: string
  lines: EhTemplateLine[]
  suggestedWeekday: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface EhPersonalProduct {
  normalizedKey: string
  displayName: string
  useCount: number
  lastUsedAt: string
  lastUsedByProfileId: string | null
}

export interface EhProductStat {
  normalizedKey: string
  displayName: string
  addCount: number
  checkCount: number
  lastCheckedAt: string | null
}

export type EhActivityType =
  | 'list_created'
  | 'list_archived'
  | 'list_deleted'
  | 'item_added'
  | 'item_removed'
  | 'member_updated'

export interface EhActivity {
  id: string
  listId: string | null
  type: EhActivityType
  profileId: string
  payload: string
  at: string
}

export type EhOfflineOp =
  | { op: 'patch_state'; state: EnkelHandlelisteState; at: string }

export interface EnkelHandlelisteState {
  version: number
  groups: EhGroup[]
  lists: EhList[]
  items: EhItem[]
  settings: EhSettings
  activity: EhActivity[]
  templates: EhTemplate[]
  personalProducts: EhPersonalProduct[]
  productStats: Record<string, EhProductStat>
}

export function createDefaultEhSettings(): EhSettings {
  return {
    capitalizeWords: false,
    showQuantity: true,
    shakeToSortEnabled: true,
    defaultGroupId: null,
    lastTab: 'lists',
    showContributorInitials: true,
  }
}

export function createEmptyEnkelHandlelisteState(): EnkelHandlelisteState {
  return {
    version: ENKEL_HANDLELISTE_VERSION,
    groups: [],
    lists: [],
    items: [],
    settings: createDefaultEhSettings(),
    activity: [],
    templates: [],
    personalProducts: [],
    productStats: {},
  }
}
