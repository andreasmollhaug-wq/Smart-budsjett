import { describe, expect, it } from 'vitest'
import type { RenovationProject } from './types'
import {
  normalizeRenovationModuleState,
  repairRenovationProjectParentRefs,
  RENOVATION_MODULE_STATE_VERSION,
} from './types'
import {
  childCanReparentToAnotherRoot,
  getActiveRootTargetsExcluding,
  getAttachRootAsChildAvailability,
} from './renovationHierarchyUi'

function bareProject(over: Partial<RenovationProject>): RenovationProject {
  return {
    id: 'x',
    name: 'N',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    budgetLines: [],
    expenses: [],
    checklist: [],
    ...over,
  }
}

describe('repairRenovationProjectParentRefs', () => {
  it('fjerner parentId når forelder mangler', () => {
    const out = repairRenovationProjectParentRefs([
      bareProject({ id: 'c', name: 'Child', parentId: 'missing' }),
    ])
    expect(out[0].parentId).toBeUndefined()
  })

  it('fjerner parentId når forelder ikke er rot (barnebarn)', () => {
    const out = repairRenovationProjectParentRefs([
      bareProject({ id: 'root', name: 'Root' }),
      bareProject({ id: 'mid', name: 'Mid', parentId: 'root' }),
      bareProject({ id: 'leaf', name: 'Leaf', parentId: 'mid' }),
    ])
    const leaf = out.find((p) => p.id === 'leaf')
    expect(leaf?.parentId).toBeUndefined()
  })

  it('fjerner parentId når aktivt barn har arkivert forelder', () => {
    const out = repairRenovationProjectParentRefs([
      bareProject({ id: 'p', name: 'Parent', status: 'archived' }),
      bareProject({ id: 'c', name: 'Child', parentId: 'p', status: 'active' }),
    ])
    const child = out.find((p) => p.id === 'c')
    expect(child?.parentId).toBeUndefined()
  })

  it('beholder gyldig aktiv forelder-rot', () => {
    const out = repairRenovationProjectParentRefs([
      bareProject({ id: 'p', name: 'Parent' }),
      bareProject({ id: 'c', name: 'Child', parentId: 'p' }),
    ])
    expect(out.find((p) => p.id === 'c')?.parentId).toBe('p')
  })

  it('fjerner self-reference', () => {
    const out = repairRenovationProjectParentRefs([bareProject({ id: 'x', parentId: 'x' })])
    expect(out[0].parentId).toBeUndefined()
  })
})

describe('normalizeRenovationModuleState hierarchy', () => {
  it('parser parentId fra json og kjører repair', () => {
    const raw = {
      version: RENOVATION_MODULE_STATE_VERSION,
      projects: [
        {
          id: 'p',
          name: 'Parent',
          createdAt: '2026-01-01T00:00:00.000Z',
          status: 'active',
          budgetLines: [],
          expenses: [],
          checklist: [],
        },
        {
          id: 'c',
          name: 'Child',
          parentId: ' p ',
          createdAt: '2026-01-01T00:00:00.000Z',
          status: 'active',
          budgetLines: [],
          expenses: [],
          checklist: [],
        },
      ],
    }
    const st = normalizeRenovationModuleState(raw)
    expect(st.projects.find((x) => x.id === 'c')?.parentId).toBe('p')
  })
})

describe('renovationHierarchyUi', () => {
  it('getActiveRootTargetsExcluding filtrerer bort eget id blant aktive røtter', () => {
    const projects: RenovationProject[] = [
      bareProject({ id: 'a', name: 'A' }),
      bareProject({ id: 'b', name: 'B' }),
    ]
    const t = getActiveRootTargetsExcluding('a', projects)
    expect(t.map((p) => p.id)).toEqual(['b'])
  })

  it('getAttachRootAsChildAvailability: rot uten barn og to røtter → ok', () => {
    const projects: RenovationProject[] = [
      bareProject({ id: 'house', name: 'Hus' }),
      bareProject({ id: 'loft', name: 'Loft' }),
    ]
    const loft = projects[1]!
    expect(getAttachRootAsChildAvailability(loft, projects)).toEqual({
      ok: true,
      targetRoots: [projects[0]!],
    })
  })

  it('getAttachRootAsChildAvailability: rot med aktivt barn → has_children', () => {
    const projects: RenovationProject[] = [
      bareProject({ id: 'house', name: 'Hus' }),
      bareProject({ id: 'rom', name: 'Bad', parentId: 'house' }),
    ]
    const r = getAttachRootAsChildAvailability(projects[0]!, projects)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('has_children')
  })

  it('getAttachRootAsChildAvailability: kun én rot → no_other_root', () => {
    const projects: RenovationProject[] = [bareProject({ id: 'solo', name: 'Solo' })]
    const r = getAttachRootAsChildAvailability(projects[0]!, projects)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('no_other_root')
  })

  it('getAttachRootAsChildAvailability: barn med forelder → not_a_root', () => {
    const projects: RenovationProject[] = [
      bareProject({ id: 'house', name: 'Hus' }),
      bareProject({ id: 'rom', name: 'R', parentId: 'house' }),
    ]
    const r = getAttachRootAsChildAvailability(projects[1]!, projects)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('not_a_root')
  })

  it('childCanReparentToAnotherRoot: rom uten egne barn → true', () => {
    const projects: RenovationProject[] = [
      bareProject({ id: 'h', name: 'H' }),
      bareProject({ id: 'r', name: 'R', parentId: 'h' }),
    ]
    expect(childCanReparentToAnotherRoot(projects[1]!, projects)).toBe(true)
  })
})
