import { describe, expect, it } from 'vitest'
import type { BudgetCategory, PersonData } from '@/lib/store'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import {
  getDefaultBudgetExportSubject,
  resolveBudgetExportScopes,
} from './resolveBudgetExportScopes'

function cat(id: string, name: string, budgeted: number[], parent: BudgetCategory['parentCategory'] = 'regninger'): BudgetCategory {
  return {
    id,
    name,
    budgeted,
    spent: 0,
    type: 'expense',
    color: '#3B5BDB',
    parentCategory: parent,
    frequency: 'monthly',
  }
}

function person(id: string, categories: BudgetCategory[]): PersonData {
  const labels = emptyLabelLists()
  return {
    budgetCategories: categories,
    transactions: [],
    debts: [],
    savingsGoals: [],
    investments: [],
    serviceSubscriptions: [],
    snowballExtraMonthly: 0,
    customBudgetLabels: labels.customBudgetLabels,
    hiddenBudgetLabels: labels.hiddenBudgetLabels,
  }
}

describe('resolveBudgetExportScopes', () => {
  const profiles = [
    { id: 'p1', name: 'Ola' },
    { id: 'p2', name: 'Kari' },
  ]

  const people: Record<string, PersonData> = {
    p1: person('p1', [cat('c1', 'Husleie', Array(12).fill(10_000))]),
    p2: person('p2', [cat('c2', 'Strøm', Array(12).fill(500))]),
  }

  const baseCtx = {
    people,
    profiles,
    isHouseholdAggregate: true,
    activeProfileId: 'p1',
    budgetYear: 2026,
    exportYear: 2026,
    archivedBudgetsByYear: {},
  }

  it('default subject er household når aggregat', () => {
    expect(getDefaultBudgetExportSubject(true, 'p1')).toBe('household')
    expect(getDefaultBudgetExportSubject(false, 'p1')).toBe('p1')
  })

  it('household scope merger kategorier fra begge profiler', () => {
    const scopes = resolveBudgetExportScopes('household', baseCtx)
    expect(scopes).toHaveLength(1)
    expect(scopes[0].label).toBe('Husholdning (samlet)')
    expect(scopes[0].categories.map((c) => c.name).sort()).toEqual(['Husleie', 'Strøm'])
  })

  it('all inkluderer household først deretter profiler', () => {
    const scopes = resolveBudgetExportScopes('all', baseCtx)
    expect(scopes.map((s) => s.key)).toEqual(['household', 'p1', 'p2'])
  })

  it('all uten husholdning gir kun profiler', () => {
    const scopes = resolveBudgetExportScopes('all', { ...baseCtx, isHouseholdAggregate: false })
    expect(scopes.map((s) => s.key)).toEqual(['p1', 'p2'])
  })

  it('enkelt profil scope', () => {
    const scopes = resolveBudgetExportScopes('p1', baseCtx)
    expect(scopes).toHaveLength(1)
    expect(scopes[0].categories).toHaveLength(1)
    expect(scopes[0].categories[0].name).toBe('Husleie')
  })

  it('arkivår leses fra archivedBudgetsByYear', () => {
    const scopes = resolveBudgetExportScopes('p1', {
      ...baseCtx,
      exportYear: 2025,
      archivedBudgetsByYear: {
        '2025': {
          p1: [cat('a1', 'Arkiv', Array(12).fill(100))],
        },
      },
    })
    expect(scopes[0].categories[0].name).toBe('Arkiv')
  })
})
