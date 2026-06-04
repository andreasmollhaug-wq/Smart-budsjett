export const ADMIN_TABS = ['oversikt', 'grafer', 'verktoy'] as const
export type AdminTabId = (typeof ADMIN_TABS)[number]
export const DEFAULT_ADMIN_TAB: AdminTabId = 'oversikt'

export function parseAdminTabParam(value: string | null): AdminTabId {
  if (value === 'grafer' || value === 'verktoy') return value
  return DEFAULT_ADMIN_TAB
}
