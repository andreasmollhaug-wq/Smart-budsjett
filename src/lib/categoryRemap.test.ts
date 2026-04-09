import { describe, expect, it } from 'vitest'
import { applyCategoryRemap, collectLabelUniverseForParent } from '@/lib/categoryRemap'
import type { ArchivedBudgetsByYear, BudgetCategory, PersonData } from '@/lib/store'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'

function cat(partial: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#3B5BDB',
    frequency: 'monthly',
    ...partial,
  }
}

describe('applyCategoryRemap', () => {
  it('omdøper egendefinert: transaksjoner, budsjett, etikett og arkiv', () => {
    const person: PersonData = {
      transactions: [
        { id: 't1', date: '2026-01-01', description: 'x', amount: 100, category: 'Gammel', type: 'expense', profileId: 'p1' },
      ],
      budgetCategories: [
        cat({
          id: 'c1',
          name: 'Gammel',
          parentCategory: 'sparing',
          type: 'expense',
          budgeted: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
      ],
      customBudgetLabels: { ...emptyLabelLists().customBudgetLabels, sparing: ['Gammel'] },
      hiddenBudgetLabels: emptyLabelLists().hiddenBudgetLabels,
      savingsGoals: [],
      debts: [],
      investments: [],
      serviceSubscriptions: [],
    }
    const archived: ArchivedBudgetsByYear = {
      '2025': {
        p1: [
          cat({
            id: 'a1',
            name: 'Gammel',
            parentCategory: 'sparing',
            type: 'expense',
            budgeted: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          }),
        ],
      },
    }
    const res = applyCategoryRemap(person, archived, 'p1', 'sparing', 'Gammel', 'Nytt navn')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.person.transactions[0]!.category).toBe('Nytt navn')
    expect(res.person.budgetCategories[0]!.name).toBe('Nytt navn')
    expect(res.person.customBudgetLabels.sparing).toContain('Nytt navn')
    expect(res.person.customBudgetLabels.sparing).not.toContain('Gammel')
    expect(res.archivedBudgetsByYear['2025']!['p1']![0]!.name).toBe('Nytt navn')
  })

  it('slår sammen to linjer og flytter koblet sparemål', () => {
    const person: PersonData = {
      transactions: [
        { id: 't1', date: '2026-01-01', description: 'x', amount: 50, category: 'Min IPS', type: 'expense', profileId: 'p1' },
      ],
      budgetCategories: [
        cat({
          id: 'old',
          name: 'Min IPS',
          parentCategory: 'sparing',
          type: 'expense',
          budgeted: Array(12).fill(100),
        }),
        cat({
          id: 'ips',
          name: 'Pensjonssparing (IPS)',
          parentCategory: 'sparing',
          type: 'expense',
          budgeted: Array(12).fill(200),
        }),
      ],
      customBudgetLabels: { ...emptyLabelLists().customBudgetLabels, sparing: ['Min IPS'] },
      hiddenBudgetLabels: emptyLabelLists().hiddenBudgetLabels,
      savingsGoals: [{ id: 'g1', linkedBudgetCategoryId: 'old' } as PersonData['savingsGoals'][0]],
      debts: [],
      investments: [],
      serviceSubscriptions: [],
    }
    const res = applyCategoryRemap(person, {}, 'p1', 'sparing', 'Min IPS', 'Pensjonssparing (IPS)')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.person.budgetCategories).toHaveLength(1)
    expect(res.person.budgetCategories[0]!.name).toBe('Pensjonssparing (IPS)')
    expect(res.person.budgetCategories[0]!.budgeted[0]).toBe(300)
    expect(res.person.transactions[0]!.category).toBe('Pensjonssparing (IPS)')
    expect(res.person.savingsGoals[0]!.linkedBudgetCategoryId).toBe('ips')
  })

  it('gir feil når to sparemål er koblet til hver sin linje som slås sammen', () => {
    const person: PersonData = {
      transactions: [],
      budgetCategories: [
        cat({ id: 'a', name: 'X', parentCategory: 'sparing', type: 'expense', budgeted: Array(12).fill(1) }),
        cat({ id: 'b', name: 'Y', parentCategory: 'sparing', type: 'expense', budgeted: Array(12).fill(2) }),
      ],
      customBudgetLabels: { ...emptyLabelLists().customBudgetLabels, sparing: ['X'] },
      hiddenBudgetLabels: emptyLabelLists().hiddenBudgetLabels,
      savingsGoals: [
        { id: 'g1', linkedBudgetCategoryId: 'a' } as PersonData['savingsGoals'][0],
        { id: 'g2', linkedBudgetCategoryId: 'b' } as PersonData['savingsGoals'][0],
      ],
      debts: [],
      investments: [],
      serviceSubscriptions: [],
    }
    const res = applyCategoryRemap(person, {}, 'p1', 'sparing', 'X', 'Y')
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toBe('merge_conflict_two_goals')
  })

  it('fjerner skjult på standardmål etter sammenslåing', () => {
    const person: PersonData = {
      transactions: [
        { id: 't1', date: '2026-01-01', description: 'x', amount: 1, category: 'Egen', type: 'expense', profileId: 'p1' },
      ],
      budgetCategories: [
        cat({ id: 'e', name: 'Egen', parentCategory: 'sparing', type: 'expense', budgeted: Array(12).fill(0) }),
      ],
      customBudgetLabels: { ...emptyLabelLists().customBudgetLabels, sparing: ['Egen'] },
      hiddenBudgetLabels: {
        ...emptyLabelLists().hiddenBudgetLabels,
        sparing: ['Pensjonssparing (IPS)'],
      },
      savingsGoals: [],
      debts: [],
      investments: [],
      serviceSubscriptions: [],
    }
    const res = applyCategoryRemap(person, {}, 'p1', 'sparing', 'Egen', 'Pensjonssparing (IPS)')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.person.hiddenBudgetLabels.sparing ?? []).not.toContain('Pensjonssparing (IPS)')
  })
})

describe('collectLabelUniverseForParent', () => {
  it('inkluderer skjulte standardnavn', () => {
    const custom = emptyLabelLists().customBudgetLabels
    const u = collectLabelUniverseForParent('sparing', custom, [])
    expect(u).toContain('Pensjonssparing (IPS)')
  })
})
