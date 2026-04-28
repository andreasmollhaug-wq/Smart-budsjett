import { describe, expect, it } from 'vitest'
import {
  applyLedgerBudgetAdjustmentToCategories,
  canApplyLedgerBudgetAdjust,
  computeLedgerImportBudgetDeltas,
  mergeBudgetCategoriesWithAdjustmentBackfill,
  parseCalendarYearFromIsoDate,
  parseMonthIndexFromIsoDate,
  subtractLedgerBudgetAdjustmentFromCategories,
} from '@/lib/ledgerImport/ledgerImportBudgetAdjust'
import type { BudgetCategory, Transaction } from '@/lib/store'

function cat(
  overrides: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name' | 'parentCategory' | 'type'>,
): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    color: '#000',
    frequency: 'monthly',
    ...overrides,
  } as BudgetCategory
}

describe('parseCalendarYearFromIsoDate / parseMonthIndexFromIsoDate', () => {
  it('parser år og måned', () => {
    expect(parseCalendarYearFromIsoDate('2026-03-15')).toBe(2026)
    expect(parseMonthIndexFromIsoDate('2026-03-15')).toBe(2)
    expect(parseMonthIndexFromIsoDate('invalid')).toBe(null)
  })
})

describe('canApplyLedgerBudgetAdjust', () => {
  const tx = (date: string): Transaction =>
    ({
      id: '1',
      date,
      description: 'x',
      amount: 100,
      category: 'Mat',
      type: 'expense',
      profileId: 'p',
    }) as Transaction

  it('tom liste er ikke ok', () => {
    expect(canApplyLedgerBudgetAdjust([], 2026).ok).toBe(false)
  })

  it('alle i samme år og lik budsjettår er ok', () => {
    expect(canApplyLedgerBudgetAdjust([tx('2026-01-01'), tx('2026-12-31')], 2026).ok).toBe(true)
  })

  it('flere år feiler', () => {
    const r = canApplyLedgerBudgetAdjust([tx('2026-01-01'), tx('2025-01-01')], 2026)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('multi_year')
  })

  it('år ulikt budsjettår feiler', () => {
    const r = canApplyLedgerBudgetAdjust([tx('2026-01-01')], 2025)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('wrong_year')
  })
})

describe('computeLedgerImportBudgetDeltas', () => {
  const office = cat({
    id: 'e1',
    name: 'Kontor',
    type: 'expense',
    parentCategory: 'utgifter',
  })

  it('fordeler utgift på måneder', () => {
    const txs: Transaction[] = [
      {
        id: 'a',
        date: '2026-01-10',
        description: 'a',
        amount: 100,
        category: 'Kontor',
        type: 'expense',
        profileId: 'p',
      },
      {
        id: 'b',
        date: '2026-02-10',
        description: 'b',
        amount: 50,
        category: 'Kontor',
        type: 'expense',
        profileId: 'p',
      },
    ]
    const { entries, skippedHouseholdSplitCount } = computeLedgerImportBudgetDeltas(txs, [office])
    expect(skippedHouseholdSplitCount).toBe(0)
    expect(entries).toHaveLength(2)
    expect(entries.find((e) => e.monthIndex === 0)?.deltaApplied).toBe(100)
    expect(entries.find((e) => e.monthIndex === 1)?.deltaApplied).toBe(50)
  })

  it('hopper householdSplit og teller', () => {
    const shared = cat({
      id: 's1',
      name: 'Delt',
      type: 'expense',
      parentCategory: 'utgifter',
      householdSplit: {
        groupId: 'g',
        mode: 'equal',
        participantProfileIds: ['a', 'b'],
      },
    })
    const txs: Transaction[] = [
      {
        id: 'x',
        date: '2026-01-01',
        description: 'x',
        amount: 40,
        category: 'Delt',
        type: 'expense',
        profileId: 'p',
      },
    ]
    const r = computeLedgerImportBudgetDeltas(txs, [shared])
    expect(r.entries).toHaveLength(0)
    expect(r.skippedHouseholdSplitCount).toBe(1)
  })

  it('inntekt med trekk: netto på transaksjon gir brutto i budsjett', () => {
    const income = cat({
      id: 'i1',
      name: 'Lønn',
      type: 'income',
      parentCategory: 'inntekter',
      incomeWithholding: { apply: true, percent: 14 },
    })
    const txs: Transaction[] = [
      {
        id: 'y',
        date: '2026-06-01',
        description: 'lønn',
        amount: 8600,
        category: 'Lønn',
        type: 'income',
        profileId: 'p',
      },
    ]
    const { entries } = computeLedgerImportBudgetDeltas(txs, [income])
    expect(entries).toHaveLength(1)
    expect(entries[0]!.monthIndex).toBe(5)
    expect(entries[0]!.deltaApplied).toBeGreaterThan(8600)
  })
})

describe('mergeBudgetCategoriesWithAdjustmentBackfill', () => {
  it('legger inn syntetisk kategori slik at apply treffer riktig id', () => {
    const synth = cat({
      id: 'synth-mat',
      name: 'Mat',
      type: 'expense',
      parentCategory: 'utgifter',
    })
    const entries = [{ categoryId: 'synth-mat', monthIndex: 2, deltaApplied: 99 }]
    const merged = mergeBudgetCategoriesWithAdjustmentBackfill([], entries, [synth])
    expect(merged).toHaveLength(1)
    const applied = applyLedgerBudgetAdjustmentToCategories(merged, entries)
    expect(applied[0]!.id).toBe('synth-mat')
    expect(applied[0]!.budgeted[2]).toBe(99)
  })
})

describe('apply og subtract', () => {
  it('rollback matcher apply', () => {
    const cats: BudgetCategory[] = [
      cat({
        id: 'c1',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
      }),
    ]
    const entries = [{ categoryId: 'c1', monthIndex: 3, deltaApplied: 250 }]
    const applied = applyLedgerBudgetAdjustmentToCategories(cats, entries)
    expect(applied[0]!.budgeted[3]).toBe(250)
    const rolled = subtractLedgerBudgetAdjustmentFromCategories(applied, entries)
    expect(rolled[0]!.budgeted[3]).toBe(0)
  })

  it('subtract klemmer ikke under null', () => {
    const cats: BudgetCategory[] = [
      cat({
        id: 'c1',
        name: 'Mat',
        type: 'expense',
        parentCategory: 'utgifter',
        budgeted: [0, 0, 0, 50],
      }),
    ]
    const entries = [{ categoryId: 'c1', monthIndex: 3, deltaApplied: 400 }]
    const rolled = subtractLedgerBudgetAdjustmentFromCategories(cats, entries)
    expect(rolled[0]!.budgeted[3]).toBe(0)
  })
})
