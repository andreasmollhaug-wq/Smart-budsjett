import type { AdminSubscriberEntry } from '@/lib/admin/types'

export type AdminSubscriberRegisteredSort = 'asc' | 'desc' | null

function registeredSortMs(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : null
}

export function filterAdminSubscribersByQuery(
  entries: AdminSubscriberEntry[],
  query: string,
): AdminSubscriberEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter((entry) => {
    if (entry.email.toLowerCase().includes(q)) return true
    const name = entry.displayName?.trim().toLowerCase()
    return name ? name.includes(q) : false
  })
}

export function sortAdminSubscribersByRegistered(
  entries: AdminSubscriberEntry[],
  direction: Exclude<AdminSubscriberRegisteredSort, null>,
): AdminSubscriberEntry[] {
  return [...entries].sort((a, b) => {
    const aMs = registeredSortMs(a.registeredAt)
    const bMs = registeredSortMs(b.registeredAt)
    if (aMs == null && bMs == null) return 0
    if (aMs == null) return 1
    if (bMs == null) return -1
    const cmp = aMs - bMs
    return direction === 'asc' ? cmp : -cmp
  })
}

export function cycleAdminSubscriberRegisteredSort(
  current: AdminSubscriberRegisteredSort,
): AdminSubscriberRegisteredSort {
  if (current === null) return 'desc'
  if (current === 'desc') return 'asc'
  return null
}

export function applyAdminSubscriberListDisplay(
  entries: AdminSubscriberEntry[],
  options: { query: string; registeredSort: AdminSubscriberRegisteredSort },
): AdminSubscriberEntry[] {
  let list = filterAdminSubscribersByQuery(entries, options.query)
  if (options.registeredSort) {
    list = sortAdminSubscribersByRegistered(list, options.registeredSort)
  }
  return list
}
