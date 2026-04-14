import { describe, expect, it } from 'vitest'
import type { RenovationProject } from './types'
import { computeProjectKpis } from './kpis'

function baseProject(over: Partial<RenovationProject> = {}): RenovationProject {
  return {
    id: 'p1',
    name: 'Test',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    budgetLines: [],
    expenses: [],
    checklist: [],
    ...over,
  }
}

describe('computeProjectKpis', () => {
  it('tomt prosjekt', () => {
    const k = computeProjectKpis(baseProject())
    expect(k.totalBudgetedNok).toBe(0)
    expect(k.totalActualNok).toBe(0)
    expect(k.varianceNok).toBe(0)
    expect(k.variancePercentOfBudget).toBeNull()
    expect(k.uncategorizedActualNok).toBe(0)
    expect(k.lineRows).toEqual([])
    expect(k.checklistPercent).toBeNull()
  })

  it('summer budsjett og faktisk', () => {
    const k = computeProjectKpis(
      baseProject({
        budgetLines: [
          { id: 'l1', label: 'A', budgetedNok: 10_000 },
          { id: 'l2', label: 'B', budgetedNok: 5_000 },
        ],
        expenses: [
          {
            id: 'e1',
            date: '2026-02-01',
            amountNok: 3_000,
            description: 'x',
            budgetLineId: 'l1',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
          {
            id: 'e2',
            date: '2026-02-02',
            amountNok: 2_000,
            description: 'y',
            createdAt: '2026-02-02T00:00:00.000Z',
          },
        ],
      }),
    )
    expect(k.totalBudgetedNok).toBe(15_000)
    expect(k.totalActualNok).toBe(5_000)
    expect(k.varianceNok).toBe(-10_000)
    expect(k.uncategorizedActualNok).toBe(2_000)
    expect(k.variancePercentOfBudget).toBeCloseTo((-10_000 / 15_000) * 100)
    const rowA = k.lineRows.find((r) => r.lineId === 'l1')
    expect(rowA?.actualNok).toBe(3_000)
    expect(rowA?.varianceNok).toBe(-7_000)
  })

  it('null prosent når budsjett totalt er 0', () => {
    const k = computeProjectKpis(
      baseProject({
        expenses: [
          {
            id: 'e1',
            date: '2026-02-01',
            amountNok: 100,
            description: 'u',
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      }),
    )
    expect(k.variancePercentOfBudget).toBeNull()
  })

  it('sjekkliste-prosent', () => {
    const k = computeProjectKpis(
      baseProject({
        checklist: [
          { id: 'c1', label: 'a', done: true, order: 0 },
          { id: 'c2', label: 'b', done: false, order: 1 },
        ],
      }),
    )
    expect(k.checklistDone).toBe(1)
    expect(k.checklistTotal).toBe(2)
    expect(k.checklistPercent).toBe(50)
  })
})
