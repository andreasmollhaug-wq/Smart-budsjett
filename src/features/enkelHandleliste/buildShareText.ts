import type { EhItem } from './types'

export function buildUncheckedItemsShareText(items: EhItem[]): string {
  const unchecked = items
    .filter((it) => !it.checked)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return unchecked
    .map((it) => {
      if (it.quantity != null && it.quantity > 0) {
        return `${it.name} (${it.quantity})`
      }
      return it.name
    })
    .join(', ')
}

export function buildSmsShareUrl(body: string): string {
  return `sms:?body=${encodeURIComponent(body)}`
}
