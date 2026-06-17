import { describe, expect, it } from 'vitest'
import { normalizeEnkelHandlelisteState } from './normalize'
import { createEmptyEnkelHandlelisteState } from './types'

describe('normalizeEnkelHandlelisteState', () => {
  it('returns empty for invalid input', () => {
    expect(normalizeEnkelHandlelisteState(null)).toEqual(createEmptyEnkelHandlelisteState())
  })

  it('drops items for unknown list ids', () => {
    const raw = {
      version: 1,
      groups: [],
      lists: [
        {
          id: 'l1',
          groupId: null,
          name: 'A',
          ownerProfileId: 'p1',
          memberProfileIds: [],
          sortOrder: 0,
          archivedAt: null,
          createdAt: '2020',
          updatedAt: '2020',
        },
      ],
      items: [
        {
          id: 'i1',
          listId: 'other',
          name: 'x',
          checked: false,
          sortOrder: 0,
          addedByProfileId: 'p1',
          addedAt: '2020',
          updatedAt: '2020',
        },
      ],
      settings: {},
      activity: [],
    }
    const n = normalizeEnkelHandlelisteState(raw)
    expect(n.items).toHaveLength(0)
  })

  it('v1 state gets v2 defaults', () => {
    const n = normalizeEnkelHandlelisteState({
      version: 1,
      groups: [],
      lists: [],
      items: [],
      settings: {},
      activity: [],
    })
    expect(n.version).toBe(2)
    expect(n.templates).toEqual([])
    expect(n.personalProducts).toEqual([])
    expect(n.productStats).toEqual({})
    expect(n.settings.lastTab).toBe('lists')
  })
})
