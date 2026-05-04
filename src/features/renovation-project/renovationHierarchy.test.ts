import { describe, expect, it } from 'vitest'
import type { RenovationProject } from './types'
import {
  normalizeRenovationModuleState,
  repairRenovationProjectParentRefs,
  RENOVATION_MODULE_STATE_VERSION,
} from './types'

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
