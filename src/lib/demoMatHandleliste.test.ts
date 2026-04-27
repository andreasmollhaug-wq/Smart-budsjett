import { describe, expect, it } from 'vitest'
import { createDemoMatHandlelisteState, matSnapshotContainsDemoMarkers } from './demoMatHandleliste'

describe('createDemoMatHandlelisteState', () => {
  it('inneholder måltider, plan for hele uken, handleliste og stiftvarer', () => {
    const ref = new Date('2026-04-27T12:00:00.000Z')
    const s = createDemoMatHandlelisteState('prof-1', ref)
    expect(s.meals.length).toBeGreaterThanOrEqual(6)
    expect(Object.keys(s.planByDate).length).toBe(7)
    expect(s.list.length).toBeGreaterThan(5)
    expect(s.staples.length).toBeGreaterThan(0)
    expect(s.settings.groceryBudgetCategoryName).toBe('Mat & dagligvarer')
    expect(s.activity.length).toBeGreaterThan(0)
    expect(matSnapshotContainsDemoMarkers(s)).toBe(true)
  })
})
