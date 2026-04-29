import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { describe, expect, it } from 'vitest'
import {
  buildAnalyseYearOptions,
  buildGoalShareRows,
  buildHouseholdAnalysePaceRows,
  buildMonthlySparingActivitySeries,
  buildPieSlicesWithOther,
  filterSavingsGoalsForAnalyse,
  parseYearMonthFromIsoDate,
  sumEffectiveSavedBySourceProfile,
  sumHouseholdPaceByProfile,
  sumAggregateMonthlyPace,
} from './sparingAnalyseDerived'
import { createDemoPersonDataForProfile, DEFAULT_PROFILE_ID } from './store'

function cat(id: string, name: string): BudgetCategory {
  return {
    id,
    name,
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    color: '#ccc',
    parentCategory: 'sparing',
    frequency: 'monthly',
  }
}

describe('parseYearMonthFromIsoDate', () => {
  it('parser yyyy-mm-dd', () => {
    expect(parseYearMonthFromIsoDate('2025-03-15')).toEqual({ year: 2025, monthIndex: 2 })
  })
  it('returnerer null ved ugyldig', () => {
    expect(parseYearMonthFromIsoDate('')).toBeNull()
  })
})

describe('filterSavingsGoalsForAnalyse', () => {
  const budgets: BudgetCategory[] = [cat('c1', 'Sparing X')]
  const txs: Transaction[] = []
  it('ekskluderer fullførte når excludeCompleted', () => {
    const goals: SavingsGoal[] = [
      {
        id: 'g1',
        name: 'A',
        targetAmount: 100,
        currentAmount: 100,
        targetDate: '',
        color: '#000',
        deposits: [],
      },
      {
        id: 'g2',
        name: 'B',
        targetAmount: 1000,
        currentAmount: 0,
        targetDate: '',
        color: '#111',
        deposits: [],
      },
    ]
    const out = filterSavingsGoalsForAnalyse(
      goals,
      { excludeCompleted: true },
      txs,
      budgets,
      'p1',
    )
    expect(out.map((g) => g.id)).toEqual(['g2'])
  })
})

describe('buildMonthlySparingActivitySeries', () => {
  const budgets: BudgetCategory[] = [cat('cat-l', 'Sparekonto')]
  const goals: SavingsGoal[] = [
    {
      id: 'g1',
      name: 'Mål',
      targetAmount: 10_000,
      currentAmount: 0,
      targetDate: '',
      color: '#000',
      linkedBudgetCategoryId: 'cat-l',
      deposits: [],
    },
  ]
  const txs: Transaction[] = [
    {
      id: 't1',
      date: '2025-03-10',
      description: 'Innskudd',
      amount: 500,
      category: 'Sparekonto',
      type: 'expense',
      profileId: 'p1',
    },
    {
      id: 't2',
      date: '2025-04-05',
      description: 'Mer',
      amount: 200,
      category: 'Sparekonto',
      type: 'expense',
      profileId: 'p1',
    },
  ]

  it('summer koblede transaksjoner per måned i periode', () => {
    const ytdMar = buildMonthlySparingActivitySeries(
      goals,
      txs,
      budgets,
      'p1',
      2025,
      'ytd',
      2,
    )
    expect(ytdMar.map((p) => p.nok)).toEqual([0, 0, 500])
    expect(ytdMar.map((p) => p.monthIndex)).toEqual([0, 1, 2])

    const onlyApr = buildMonthlySparingActivitySeries(goals, txs, budgets, 'p1', 2025, 'month', 3)
    expect(onlyApr.length).toBe(1)
    expect(onlyApr[0]!.nok).toBe(200)
  })

  it('bruker deposits for ukoblede mål', () => {
    const unlinked: SavingsGoal[] = [
      {
        id: 'u1',
        name: 'U',
        targetAmount: 5000,
        currentAmount: 300,
        targetDate: '',
        color: '#000',
        deposits: [
          { id: 'd1', date: '2025-02-01', amount: 100 },
          { id: 'd2', date: '2025-02-15', amount: 50 },
        ],
      },
    ]
    const feb = buildMonthlySparingActivitySeries(unlinked, [], [], 'p1', 2025, 'month', 1)
    expect(feb[0]!.nok).toBe(150)
  })
})

describe('buildPieSlicesWithOther', () => {
  const row = (
    goalId: string,
    name: string,
    effectiveNok: number,
    color: string,
    pctOfTotal: number,
  ) => ({ goalId, name, effectiveNok, color, pctOfTotal })

  it('returnerer tom liste når ingen positive beløp', () => {
    const { slices, totalPositive } = buildPieSlicesWithOther(
      [row('a', 'A', 0, '#f00', 0)],
      7,
    )
    expect(slices).toEqual([])
    expect(totalPositive).toBe(0)
  })

  it('beholder alle slisser når antall ≤ topN', () => {
    const rows = [
      row('a', 'A', 60, '#f00', 60),
      row('b', 'B', 40, '#0f0', 40),
    ]
    const { slices, totalPositive } = buildPieSlicesWithOther(rows, 7)
    expect(totalPositive).toBe(100)
    expect(slices.map((s) => s.key)).toEqual(['a', 'b'])
    expect(slices.map((s) => s.value)).toEqual([60, 40])
    expect(slices.reduce((s, x) => s + x.pctOfPositiveTotal, 0)).toBeCloseTo(100, 5)
  })

  it('slår sammen hale til én Øvrige-slisse når antall > topN', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      row(`g${i}`, `Mål ${i}`, 10 - i, `#${i}${i}${i}`, 0),
    )
    const { slices, totalPositive } = buildPieSlicesWithOther(rows, 3)
    expect(totalPositive).toBe(10 + 9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1)
    expect(slices).toHaveLength(4)
    expect(slices[0]!.key).toBe('g0')
    expect(slices[1]!.key).toBe('g1')
    expect(slices[2]!.key).toBe('g2')
    expect(slices[3]!.key).toBe('_other')
    expect(slices[3]!.name).toBe('Øvrige')
    expect(slices[3]!.value).toBe(7 + 6 + 5 + 4 + 3 + 2 + 1)
    const sumPct = slices.reduce((s, x) => s + x.pctOfPositiveTotal, 0)
    expect(sumPct).toBeCloseTo(100, 5)
  })
})

describe('buildGoalShareRows', () => {
  it('fordeler effektiv sparing mellom mål', () => {
    const budgets: BudgetCategory[] = []
    const goals: SavingsGoal[] = [
      {
        id: 'a',
        name: 'Lav',
        targetAmount: 100,
        currentAmount: 25,
        targetDate: '',
        color: '#f00',
        deposits: [],
      },
      {
        id: 'b',
        name: 'Høy',
        targetAmount: 100,
        currentAmount: 75,
        targetDate: '',
        color: '#0f0',
        deposits: [],
      },
    ]
    const rows = buildGoalShareRows(goals, [], budgets, 'p1')
    expect(rows.find((r) => r.goalId === 'b')!.pctOfTotal).toBe(75)
    expect(rows.find((r) => r.goalId === 'a')!.pctOfTotal).toBe(25)
  })
})

describe('sumEffectiveSavedBySourceProfile', () => {
  const budgets: BudgetCategory[] = []
  it('grupperer på sourceProfileId', () => {
    const goals: SavingsGoal[] = [
      {
        id: 'hh-p1-x',
        name: 'A',
        targetAmount: 100,
        currentAmount: 60,
        targetDate: '',
        color: '#000',
        deposits: [],
        sourceProfileId: 'p1',
      },
      {
        id: 'hh-p2-x',
        name: 'B',
        targetAmount: 100,
        currentAmount: 40,
        targetDate: '',
        color: '#111',
        deposits: [],
        sourceProfileId: 'p2',
      },
    ]
    const rows = sumEffectiveSavedBySourceProfile(goals, [], budgets, 'p1', ['p1', 'p2'])
    expect(rows.find((r) => r.profileId === 'p1')!.effectiveNok).toBe(60)
    expect(rows.find((r) => r.profileId === 'p2')!.effectiveNok).toBe(40)
  })
})

describe('buildMonthlySparingActivitySeries demo data', () => {
  it('koblede demo-sparemål gir ikke-null sparingaktivitet summert over året', () => {
    const person = createDemoPersonDataForProfile(DEFAULT_PROFILE_ID, 2026, 0)
    const series = buildMonthlySparingActivitySeries(
      person.savingsGoals,
      person.transactions,
      person.budgetCategories,
      DEFAULT_PROFILE_ID,
      2026,
      'year',
      11,
    )
    const total = series.reduce((s, p) => s + p.nok, 0)
    expect(total).toBeGreaterThan(0)
  })
})

describe('buildHouseholdAnalysePaceRows', () => {
  /** 1. juni 2026 — samme anker som savingsDerived.pace.test */
  const june1 = new Date(2026, 5, 1, 12, 0, 0).getTime()

  it('setter sparetempo og profil per mål', () => {
    const goals: SavingsGoal[] = [
      {
        id: 'g1',
        name: 'Ferie',
        targetAmount: 10_000,
        currentAmount: 3000,
        targetDate: '2026-07-01',
        color: '#f00',
        deposits: [],
        sourceProfileId: 'p1',
      },
    ]
    const budgets: BudgetCategory[] = []
    const txs: Transaction[] = []
    const rows = buildHouseholdAnalysePaceRows(goals, txs, budgets, 'agg', [{ id: 'p1', name: 'Anna' }], june1)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.profileId).toBe('p1')
    expect(rows[0]!.profileName).toBe('Anna')
    expect(rows[0]!.remainingNok).toBe(7000)
    expect(rows[0]!.pace.status).toBe('ok')
    expect(rows[0]!.pace.weeklyNok).toBe(Math.round((7000 * 7) / 30))
  })

  it('sumHouseholdPaceByProfile summerer krav for parallelle mål på samme profil', () => {
    const goals: SavingsGoal[] = [
      {
        id: 'g1',
        name: 'A',
        targetAmount: 10_000,
        currentAmount: 3000,
        targetDate: '2026-07-01',
        color: '#f00',
        deposits: [],
        sourceProfileId: 'p1',
      },
      {
        id: 'g2',
        name: 'B',
        targetAmount: 5000,
        currentAmount: 0,
        targetDate: '2026-07-01',
        color: '#0f0',
        deposits: [],
        sourceProfileId: 'p1',
      },
    ]
    const rows = buildHouseholdAnalysePaceRows(goals, [], [], 'agg', [
      { id: 'p1', name: 'Anna' },
      { id: 'p2', name: 'Bob' },
    ], june1)
    const w1 = rows.find((r) => r.goalId === 'g1')!.pace.weeklyNok ?? 0
    const w2 = rows.find((r) => r.goalId === 'g2')!.pace.weeklyNok ?? 0
    const totals = sumHouseholdPaceByProfile(rows, [
      { id: 'p1', name: 'Anna' },
      { id: 'p2', name: 'Bob' },
    ])
    expect(totals.find((t) => t.profileId === 'p1')!.weeklyNokSum).toBe(w1 + w2)
    expect(totals.find((t) => t.profileId === 'p2')!.weeklyNokSum).toBe(0)
  })
})

describe('sumAggregateMonthlyPace', () => {
  const june1 = new Date(2026, 5, 1, 12, 0, 0).getTime()

  it('matcher summen av monthlyNok for alle mål med ok-status', () => {
    const goals: SavingsGoal[] = [
      {
        id: 'g1',
        name: 'A',
        targetAmount: 10_000,
        currentAmount: 3000,
        targetDate: '2026-07-01',
        color: '#f00',
        deposits: [],
        sourceProfileId: 'p1',
      },
      {
        id: 'g2',
        name: 'B',
        targetAmount: 5000,
        currentAmount: 0,
        targetDate: '2026-07-01',
        color: '#0f0',
        deposits: [],
        sourceProfileId: 'p1',
      },
    ]
    const rows = buildHouseholdAnalysePaceRows(goals, [], [], 'agg', [{ id: 'p1', name: 'Anna' }], june1)
    const expected = rows
      .filter((r) => r.pace.status === 'ok')
      .reduce((s, r) => s + (r.pace.monthlyNok ?? 0), 0)
    expect(sumAggregateMonthlyPace(rows)).toBe(expected)
    expect(expected).toBeGreaterThan(0)
  })
})

describe('buildAnalyseYearOptions', () => {
  it('samler unike år', () => {
    const opts = buildAnalyseYearOptions({
      budgetYear: 2026,
      transactions: [{ id: '1', date: '2024-06-01', description: '', amount: 1, category: 'x', type: 'expense' }],
      savingsGoals: [],
    })
    expect(opts).toContain(2026)
    expect(opts).toContain(2024)
    expect(opts.indexOf(2026)).toBeLessThan(opts.indexOf(2024))
  })
})
