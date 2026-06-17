import { describe, expect, it } from 'vitest'
import { buildSmsShareUrl, buildUncheckedItemsShareText } from './buildShareText'
import type { EhItem } from './types'

describe('buildShareText', () => {
  it('builds comma-separated unchecked items', () => {
    const items: EhItem[] = [
      {
        id: '1',
        listId: 'l',
        name: 'brød',
        quantity: null,
        checked: true,
        sortOrder: 0,
        addedByProfileId: 'p',
        addedAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        listId: 'l',
        name: 'melk',
        quantity: 2,
        checked: false,
        sortOrder: 1,
        addedByProfileId: 'p',
        addedAt: '',
        updatedAt: '',
      },
    ]
    expect(buildUncheckedItemsShareText(items)).toBe('melk (2)')
  })

  it('builds sms url', () => {
    expect(buildSmsShareUrl('a, b')).toContain('sms:?body=')
  })
})
