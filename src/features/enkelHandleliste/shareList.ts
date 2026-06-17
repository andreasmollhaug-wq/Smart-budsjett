'use client'

import { buildSmsShareUrl, buildUncheckedItemsShareText } from './buildShareText'
import type { EhItem } from './types'

export async function shareShoppingList(items: EhItem[], listName: string): Promise<void> {
  const body = buildUncheckedItemsShareText(items)
  const text = body ? `${listName}: ${body}` : `${listName}: (tom liste)`

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: listName, text })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof window !== 'undefined') {
    window.location.href = buildSmsShareUrl(text)
  }
}
