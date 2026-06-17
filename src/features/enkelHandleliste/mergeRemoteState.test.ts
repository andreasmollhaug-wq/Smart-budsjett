import { describe, expect, it } from 'vitest'
import { createEmptyEnkelHandlelisteState } from './types'
import { mergeRemoteState } from './mergeRemoteState'

describe('mergeRemoteState', () => {
  it('keeps newer item by updatedAt', () => {
    const local = createEmptyEnkelHandlelisteState()
    local.lists = [
      {
        id: 'l1',
        groupId: null,
        name: 'L',
        ownerProfileId: 'p1',
        memberProfileIds: [],
        sortOrder: 0,
        archivedAt: null,
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      },
    ]
    local.items = [
      {
        id: 'i1',
        listId: 'l1',
        name: 'Local',
        quantity: null,
        checked: false,
        sortOrder: 0,
        addedByProfileId: 'p1',
        addedAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-02T00:00:00.000Z',
      },
    ]
    const remote = structuredClone(local)
    remote.items[0]!.name = 'Remote'
    remote.items[0]!.updatedAt = '2019-01-01T00:00:00.000Z'
    const merged = mergeRemoteState(local, remote)
    expect(merged.items[0]!.name).toBe('Local')
  })
})
