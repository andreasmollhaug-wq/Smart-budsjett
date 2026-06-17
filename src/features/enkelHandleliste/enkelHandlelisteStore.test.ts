import { describe, expect, it, beforeEach } from 'vitest'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import { createEmptyEnkelHandlelisteState } from './types'

describe('enkelHandlelisteStore', () => {
  beforeEach(() => {
    useEnkelHandlelisteStore.getState().hydrate(createEmptyEnkelHandlelisteState())
  })

  it('creates list and adds items', () => {
    const r = useEnkelHandlelisteStore.getState().ehCreateList({
      name: 'Butikk',
      groupId: null,
      ownerProfileId: 'p1',
      allProfileIds: ['p1', 'p2'],
      familyEnabled: true,
    })
    expect(r.ok).toBe(true)
    const listId = r.id!
    const add = useEnkelHandlelisteStore.getState().ehAddItems(
      listId,
      ['brød', 'melk'],
      'p1',
      false,
    )
    expect(add.ok).toBe(true)
    expect(add.added).toBe(2)
    const items = useEnkelHandlelisteStore.getState().items.filter((i) => i.listId === listId)
    expect(items).toHaveLength(2)
  })

  it('owner can remove any item; member only own', () => {
    const { id: listId } = useEnkelHandlelisteStore.getState().ehCreateList({
      name: 'L',
      groupId: null,
      ownerProfileId: 'owner',
      allProfileIds: ['owner', 'member'],
      familyEnabled: true,
    }) as { ok: true; id: string }
    useEnkelHandlelisteStore.getState().ehSetListMembers(listId, ['member'], 'owner')
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['x'], 'member', false)
    const itemId = useEnkelHandlelisteStore.getState().items.find((i) => i.listId === listId)!.id
    expect(useEnkelHandlelisteStore.getState().ehRemoveItem(itemId, 'member').ok).toBe(true)
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['y'], 'owner', false)
    const item2 = useEnkelHandlelisteStore.getState().items.find((i) => i.name === 'y')!.id
    expect(useEnkelHandlelisteStore.getState().ehRemoveItem(item2, 'member').ok).toBe(false)
    expect(useEnkelHandlelisteStore.getState().ehRemoveItem(item2, 'owner').ok).toBe(true)
  })

  it('sorts checked to bottom', () => {
    const { id: listId } = useEnkelHandlelisteStore.getState().ehCreateList({
      name: 'L',
      groupId: null,
      ownerProfileId: 'p1',
      allProfileIds: ['p1'],
      familyEnabled: false,
    }) as { ok: true; id: string }
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['a', 'b'], 'p1', false)
    const items = useEnkelHandlelisteStore.getState().items.filter((i) => i.listId === listId)
    useEnkelHandlelisteStore.getState().ehToggleItem(items[0]!.id, 'p1')
    useEnkelHandlelisteStore.getState().ehSortCheckedToBottom(listId, 'p1')
    const sorted = useEnkelHandlelisteStore
      .getState()
      .items.filter((i) => i.listId === listId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    expect(sorted[0]!.checked).toBe(false)
    expect(sorted[1]!.checked).toBe(true)
  })

  it('records personal products and stats on add/toggle', () => {
    const { id: listId } = useEnkelHandlelisteStore.getState().ehCreateList({
      name: 'L',
      groupId: null,
      ownerProfileId: 'p1',
      allProfileIds: ['p1'],
      familyEnabled: false,
    }) as { ok: true; id: string }
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['Mormors saus'], 'p1', false)
    const personal = useEnkelHandlelisteStore.getState().personalProducts
    expect(personal.some((p) => p.displayName === 'Mormors saus')).toBe(true)
    const itemId = useEnkelHandlelisteStore.getState().items[0]!.id
    useEnkelHandlelisteStore.getState().ehToggleItem(itemId, 'p1')
    const stats = useEnkelHandlelisteStore.getState().productStats
    const key = personal.find((p) => p.displayName === 'Mormors saus')!.normalizedKey
    expect(stats[key]?.checkCount).toBe(1)
  })

  it('creates template from list and applies merge', () => {
    const { id: listId } = useEnkelHandlelisteStore.getState().ehCreateList({
      name: 'L',
      groupId: null,
      ownerProfileId: 'p1',
      allProfileIds: ['p1'],
      familyEnabled: false,
    }) as { ok: true; id: string }
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['brød'], 'p1', false)
    const cr = useEnkelHandlelisteStore.getState().ehCreateTemplateFromList(
      listId,
      'Uke',
      'p1',
      false,
    )
    expect(cr.ok).toBe(true)
    const tplId = cr.id!
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['melk'], 'p1', false)
    useEnkelHandlelisteStore.getState().ehApplyTemplate(tplId, listId, 'merge', 'p1')
    const names = useEnkelHandlelisteStore
      .getState()
      .items.filter((i) => i.listId === listId)
      .map((i) => i.name)
    expect(names).toContain('brød')
    expect(names).toContain('melk')
  })

  it('template from list excludes checked items by default', () => {
    const { id: listId } = useEnkelHandlelisteStore.getState().ehCreateList({
      name: 'L',
      groupId: null,
      ownerProfileId: 'p1',
      allProfileIds: ['p1'],
      familyEnabled: false,
    }) as { ok: true; id: string }
    useEnkelHandlelisteStore.getState().ehAddItems(listId, ['a', 'b'], 'p1', false)
    const items = useEnkelHandlelisteStore.getState().items.filter((i) => i.listId === listId)
    useEnkelHandlelisteStore.getState().ehToggleItem(items[0]!.id, 'p1')
    const cr = useEnkelHandlelisteStore.getState().ehCreateTemplateFromList(listId, 'Mal', 'p1')
    const tpl = useEnkelHandlelisteStore.getState().templates.find((t) => t.id === cr.id)!
    expect(tpl.lines.map((l) => l.name)).toEqual(['b'])
  })
})
