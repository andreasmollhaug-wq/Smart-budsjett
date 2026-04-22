import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  buildBankReportIncomeDetail,
  buildCategoryBudgetYearMatrix,
  buildMonthlyBudgetActualSeries,
  buildMonthlyNetSeriesForPeriod,
  groupBudgetCategoriesByParent,
  listBudgetedFixedMonthlyExpensesForMonth,
  referenceMonthIndexForBudgetYear,
  sumActualsByMonthForType,
  sumBudgetedByMonthForType,
  sumBudgetedFixedMonthlyExpensesForMonth,
  sumBudgetedIncomeForMonth,
  sumIncomeExpenseNetByProfileForMonthRange,
  sumActualByProfileForCategoryInMonthRange,
  sumBudgetVsActualByParent,
  type BudgetVsActualRow,
} from './bankReportData'
import { createEmptyPersonData, type BudgetCategory, type Transaction } from './store'

function cat(overrides: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...overrides,
  } as BudgetCategory
}

describe('buildMonthlyBudgetActualSeries', () => {
  it('returnerer 12 punkter med nuller uten kategorier og transaksjoner', () => {
    const series = buildMonthlyBudgetActualSeries([], 2026, [])
    expect(series).toHaveLength(12)
    for (const p of series) {
      expect(p.budgetedIncome).toBe(0)
      expect(p.budgetedExpense).toBe(0)
      expect(p.actualIncome).toBe(0)
      expect(p.actualExpense).toBe(0)
    }
  })

  it('matcher budsjett og faktisk for én måned', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: [0, 40000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
      cat({
        id: '2',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [0, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-02-15',
        description: 'Lønn',
        amount: 42000,
        category: 'Lønn',
        type: 'income',
      },
      {
        id: 't2',
        date: '2026-02-20',
        description: 'Rema',
        amount: 4800,
        category: 'Mat',
        type: 'expense',
      },
    ]
    const series = buildMonthlyBudgetActualSeries(transactions, 2026, budgetCategories)
    expect(series[0].budgetedIncome).toBe(0)
    expect(series[0].actualExpense).toBe(0)
    expect(series[1].budgetedIncome).toBe(40000)
    expect(series[1].budgetedExpense).toBe(5000)
    expect(series[1].actualIncome).toBe(42000)
    expect(series[1].actualExpense).toBe(4800)
    expect(series[1].label).toBe('Feb')
  })
})

describe('buildMonthlyNetSeriesForPeriod', () => {
  it('returnerer tom liste når start er etter slutt', () => {
    expect(buildMonthlyNetSeriesForPeriod([], 2026, [], 3, 1)).toEqual([])
  })

  it('én måned: netto matcher budsjett vs faktisk', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: [0, 40000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
      cat({
        id: '2',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [0, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-02-15',
        description: 'Lønn',
        amount: 42000,
        category: 'Lønn',
        type: 'income',
      },
      {
        id: 't2',
        date: '2026-02-20',
        description: 'Rema',
        amount: 4800,
        category: 'Mat',
        type: 'expense',
      },
    ]
    const pts = buildMonthlyNetSeriesForPeriod(transactions, 2026, budgetCategories, 1, 1)
    expect(pts).toHaveLength(1)
    expect(pts[0]!.budgetNet).toBe(35000)
    expect(pts[0]!.actualNet).toBe(37200)
    expect(pts[0]!.label).toBe('Feb')
  })

  it('flere måneder: ett punkt per måned i intervall', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: [10000, 10000, 10000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
      cat({
        id: '2',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [2000, 2000, 2000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-01-05',
        description: 'L',
        amount: 10000,
        category: 'Lønn',
        type: 'income',
      },
      {
        id: 'b',
        date: '2026-01-06',
        description: 'M',
        amount: 2000,
        category: 'Mat',
        type: 'expense',
      },
      {
        id: 'c',
        date: '2026-03-10',
        description: 'L',
        amount: 10000,
        category: 'Lønn',
        type: 'income',
      },
      {
        id: 'd',
        date: '2026-03-12',
        description: 'M',
        amount: 2500,
        category: 'Mat',
        type: 'expense',
      },
    ]
    const pts = buildMonthlyNetSeriesForPeriod(transactions, 2026, budgetCategories, 0, 2)
    expect(pts).toHaveLength(3)
    expect(pts[0]!.monthIndex).toBe(0)
    expect(pts[0]!.budgetNet).toBe(8000)
    expect(pts[0]!.actualNet).toBe(8000)
    expect(pts[1]!.budgetNet).toBe(8000)
    expect(pts[1]!.actualNet).toBe(0)
    expect(pts[2]!.budgetNet).toBe(8000)
    expect(pts[2]!.actualNet).toBe(7500)
  })
})

describe('sumActualsByMonthForType og sumBudgetedByMonthForType', () => {
  it('aggererer faktisk inntekt per måned', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-02-01',
        description: 'Lønn',
        amount: 40000,
        category: 'Lønn',
        type: 'income',
      },
    ]
    const actuals = sumActualsByMonthForType(transactions, 2026, 'income')
    expect(actuals[1]).toBe(40000)
    expect(actuals[0]).toBe(0)
  })

  it('aggererer budsjett utgift per måned', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [0, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    const bud = sumBudgetedByMonthForType(budgetCategories, 'expense')
    expect(bud[1]).toBe(5000)
  })
})

describe('sumIncomeExpenseNetByProfileForMonthRange', () => {
  it('summerer per profil i valgt månedintervall', () => {
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-03-10',
        description: 'Lønn',
        amount: 50000,
        category: 'Lønn',
        type: 'income',
        profileId: 'p1',
      },
      {
        id: 'b',
        date: '2026-03-12',
        description: 'Mat',
        amount: 2000,
        category: 'Mat',
        type: 'expense',
        profileId: 'p1',
      },
      {
        id: 'c',
        date: '2026-03-15',
        description: 'Bonus',
        amount: 10000,
        category: 'Annet',
        type: 'income',
        profileId: 'p2',
      },
      {
        id: 'd',
        date: '2026-04-01',
        description: 'Senere',
        amount: 1000,
        category: 'Mat',
        type: 'expense',
        profileId: 'p1',
      },
    ]
    const rows = sumIncomeExpenseNetByProfileForMonthRange(transactions, 2026, 2, 2)
    expect(rows).toHaveLength(2)
    const p1 = rows.find((r) => r.profileId === 'p1')
    const p2 = rows.find((r) => r.profileId === 'p2')
    expect(p1).toEqual({ profileId: 'p1', income: 50000, expense: 2000, net: 48000 })
    expect(p2).toEqual({ profileId: 'p2', income: 10000, expense: 0, net: 10000 })
  })

  it('bøttelegger manglende profileId som tom streng', () => {
    const transactions: Transaction[] = [
      {
        id: 'x',
        date: '2026-01-05',
        description: 'X',
        amount: 100,
        category: 'C',
        type: 'income',
      },
    ]
    const rows = sumIncomeExpenseNetByProfileForMonthRange(transactions, 2026, 0, 0)
    expect(rows).toEqual([{ profileId: '', income: 100, expense: 0, net: 100 }])
  })
})

describe('sumActualByProfileForCategoryInMonthRange', () => {
  it('summerer faktisk per profil for én kategori og type i perioden', () => {
    const transactions: Transaction[] = [
      {
        id: 'a',
        date: '2026-04-10',
        description: 'Lønn',
        amount: 40000,
        category: 'Lønn',
        type: 'income',
        profileId: 'p1',
      },
      {
        id: 'b',
        date: '2026-04-12',
        description: 'Lønn ekstra',
        amount: 5000,
        category: 'Lønn',
        type: 'income',
        profileId: 'p2',
      },
      {
        id: 'c',
        date: '2026-04-15',
        description: 'Annen inntekt',
        amount: 1000,
        category: 'Annen',
        type: 'income',
        profileId: 'p1',
      },
      {
        id: 'd',
        date: '2026-05-01',
        description: 'Feil måned',
        amount: 99999,
        category: 'Lønn',
        type: 'income',
        profileId: 'p1',
      },
    ]
    const rows = sumActualByProfileForCategoryInMonthRange(transactions, 2026, 3, 3, 'Lønn', 'income')
    expect(rows).toHaveLength(2)
    expect(rows.find((r) => r.profileId === 'p1')).toEqual({ profileId: 'p1', actual: 40000 })
    expect(rows.find((r) => r.profileId === 'p2')).toEqual({ profileId: 'p2', actual: 5000 })
  })

  it('skiller ikke utgift fra inntekt i samme kategori-navn', () => {
    const transactions: Transaction[] = [
      {
        id: 'e',
        date: '2026-02-01',
        amount: 100,
        category: 'X',
        type: 'expense',
        description: 'x',
        profileId: 'a',
      },
    ]
    const inc = sumActualByProfileForCategoryInMonthRange(transactions, 2026, 1, 1, 'X', 'income')
    const exp = sumActualByProfileForCategoryInMonthRange(transactions, 2026, 1, 1, 'X', 'expense')
    expect(inc).toEqual([])
    expect(exp).toEqual([{ profileId: 'a', actual: 100 }])
  })
})

describe('buildCategoryBudgetYearMatrix', () => {
  it('returnerer 12 månedlige budsjettbeløp per kategori', () => {
    const b = [...Array(12)].map((_, i) => (i === 0 ? 500 : 0))
    const m = buildCategoryBudgetYearMatrix([
      cat({
        id: 'a',
        name: 'Test',
        parentCategory: 'utgifter',
        type: 'expense',
        budgeted: b,
      }),
    ])
    expect(m.get('Test')).toEqual(b)
  })
})

describe('groupBudgetCategoriesByParent', () => {
  it('grupperer og sorterer navn', () => {
    const g = groupBudgetCategoriesByParent([
      cat({ id: '2', name: 'B', parentCategory: 'utgifter', type: 'expense' }),
      cat({ id: '1', name: 'A', parentCategory: 'utgifter', type: 'expense' }),
    ])
    expect(g.utgifter.map((c) => c.name)).toEqual(['A', 'B'])
  })
})

describe('referenceMonthIndexForBudgetYear', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('bruker inneværende måned når år matcher', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00'))
    expect(referenceMonthIndexForBudgetYear(2026)).toBe(5)
  })

  it('bruker januar når budsjettår ikke er kalenderår', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00'))
    expect(referenceMonthIndexForBudgetYear(2025)).toBe(0)
  })
})

describe('faste utgifter og inntekt per måned (budsjett)', () => {
  it('summerer kun månedlige utgifter', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Husleie',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'monthly',
        budgeted: Array(12).fill(1000),
      }),
      cat({
        id: '2',
        name: 'Årsavgift',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'yearly',
        budgeted: [12000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    expect(sumBudgetedFixedMonthlyExpensesForMonth(budgetCategories, 0)).toBe(1000)
  })

  it('summerer budsjettert inntekt for én måned', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: [0, 45000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ]
    expect(sumBudgetedIncomeForMonth(budgetCategories, 1)).toBe(45000)
  })

  it('lister månedlige utgifter med beløp > 0, sortert', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: 'a',
        name: 'Husleie',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'monthly',
        budgeted: [12000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
      cat({
        id: 'b',
        name: 'Strøm',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'monthly',
        budgeted: [500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }),
      cat({
        id: 'c',
        name: 'Tom',
        type: 'expense',
        parentCategory: 'regninger',
        frequency: 'monthly',
        budgeted: Array(12).fill(0),
      }),
    ]
    const list = listBudgetedFixedMonthlyExpensesForMonth(budgetCategories, 0)
    expect(list.map((r) => r.name)).toEqual(['Husleie', 'Strøm'])
    expect(list[0].amount).toBe(12000)
  })
})

describe('buildBankReportIncomeDetail', () => {
  it('returnerer null når verken budsjett eller faktisk har forenklet trekk', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: Array(12).fill(50_000),
      }),
    ]
    const transactions: Transaction[] = [
      {
        id: 't',
        date: '2026-03-15',
        amount: 50_000,
        category: 'Lønn',
        type: 'income',
      },
    ]
    expect(buildBankReportIncomeDetail(transactions, budgetCategories, 2026, 2)).toBeNull()
  })

  it('returnerer oppdeling når budsjett har trekk (netto matcher budsjettkolonne)', () => {
    const budgetCategories: BudgetCategory[] = [
      cat({
        id: '1',
        name: 'Lønn',
        type: 'income',
        parentCategory: 'inntekter',
        budgeted: Array(12).fill(100_000),
        incomeWithholding: { apply: true, percent: 25 },
      }),
    ]
    const d = buildBankReportIncomeDetail([], budgetCategories, 2026, 0)
    expect(d).not.toBeNull()
    expect(d!.budgeted.gross).toBe(100_000)
    expect(d!.budgeted.withholding).toBe(25_000)
    expect(d!.budgeted.net).toBe(75_000)
    expect(d!.actual.net).toBe(0)
  })

  it('teller trekk for brutto-inntektstransaksjon med profilstandard', () => {
    const people = {
      p1: {
        ...createEmptyPersonData(),
        defaultIncomeWithholding: { apply: true, percent: 20 },
      },
    }
    const transactions: Transaction[] = [
      {
        id: 't',
        date: '2026-01-10',
        amount: 100_000,
        category: 'X',
        type: 'income',
        profileId: 'p1',
        incomeIsNet: false,
      },
    ]
    const d = buildBankReportIncomeDetail(transactions, [], 2026, 0, people)
    expect(d).not.toBeNull()
    expect(d!.actual.gross).toBe(100_000)
    expect(d!.actual.withholding).toBe(20_000)
    expect(d!.actual.net).toBe(80_000)
  })
})

describe('sumBudgetVsActualByParent', () => {
  it('summerer flere rader i samme foreldregruppe', () => {
    const rows: BudgetVsActualRow[] = [
      {
        categoryId: '1',
        name: 'A',
        parentCategory: 'utgifter',
        type: 'expense',
        budgeted: 100,
        actual: 40,
        variance: -60,
      },
      {
        categoryId: '2',
        name: 'B',
        parentCategory: 'utgifter',
        type: 'expense',
        budgeted: 200,
        actual: 150,
        variance: -50,
      },
      {
        categoryId: '3',
        name: 'C',
        parentCategory: 'inntekter',
        type: 'income',
        budgeted: 10_000,
        actual: 8_000,
        variance: -2_000,
      },
    ]
    const s = sumBudgetVsActualByParent(rows)
    expect(s.utgifter).toEqual({ budgeted: 300, actual: 190 })
    expect(s.inntekter).toEqual({ budgeted: 10_000, actual: 8_000 })
    expect(s.regninger).toEqual({ budgeted: 0, actual: 0 })
    expect(s.gjeld).toEqual({ budgeted: 0, actual: 0 })
    expect(s.sparing).toEqual({ budgeted: 0, actual: 0 })
  })
})

