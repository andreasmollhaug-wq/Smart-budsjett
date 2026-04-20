import { describe, expect, it } from 'vitest'
import {
  computeIncomeSprintDerived,
  ensureIncomeSprintPlanId,
  formatIncomeSprintPlanPeriodNb,
  listMonthKeysInRange,
  monthKeyHeadingNb,
  reconcileIncomeSprintPlan,
  taxMultiplier,
  yearMonthFromIsoDate,
} from '@/lib/incomeSprint'

describe('incomeSprint', () => {
  it('listMonthKeysInRange spans inclusive calendar months', () => {
    expect(listMonthKeysInRange('2026-03-23', '2026-07-01')).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
    ])
  })

  it('returns empty for invalid order', () => {
    expect(listMonthKeysInRange('2026-08-01', '2026-01-01')).toEqual([])
    expect(listMonthKeysInRange('bad', '2026-01-01')).toEqual([])
  })

  it('yearMonthFromIsoDate parses', () => {
    expect(yearMonthFromIsoDate('2026-03-23')).toEqual({ y: 2026, m: 3 })
    expect(yearMonthFromIsoDate('nope')).toBeNull()
  })

  it('monthKeyHeadingNb uses full month name and year', () => {
    expect(monthKeyHeadingNb('2026-03')).toBe('Mars 2026')
    expect(monthKeyHeadingNb('2027-12')).toBe('Desember 2027')
  })

  it('ensureIncomeSprintPlanId fills missing id', () => {
    const p = reconcileIncomeSprintPlan({
      id: '',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      goalBasis: 'afterTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      sources: [],
    })
    const e = ensureIncomeSprintPlanId(p)
    expect(e.id.length).toBeGreaterThan(0)
    expect(ensureIncomeSprintPlanId(e).id).toBe(e.id)
  })

  it('formatIncomeSprintPlanPeriodNb', () => {
    expect(
      formatIncomeSprintPlanPeriodNb({ startDate: '2026-03-01', endDate: '2026-07-31' }),
    ).toMatch(/2026/)
  })

  it('taxMultiplier', () => {
    expect(taxMultiplier(false, 40)).toBe(1)
    expect(taxMultiplier(true, 40)).toBeCloseTo(0.6)
    expect(taxMultiplier(true, 0)).toBe(1)
  })

  it('reconcileIncomeSprintPlan aligns month keys and clamps', () => {
    const r = reconcileIncomeSprintPlan({
      id: 'plan-test-1',
      startDate: '2026-01-01',
      endDate: '2026-02-28',
      goalBasis: 'afterTax',
      targetAmount: -10,
      applyTax: true,
      taxPercent: 200,
      paidTowardGoal: -5,
      sources: [
        {
          id: 'a',
          name: 'A',
          amountsByMonthKey: { '2026-01': 1000, '2099-12': 9 },
        },
      ],
    })
    expect(r.targetAmount).toBe(0)
    expect(r.paidTowardGoal).toBe(0)
    expect(r.taxPercent).toBe(100)
    expect(Object.keys(r.sources[0]!.amountsByMonthKey).sort()).toEqual(['2026-01', '2026-02'])
    expect(r.sources[0]!.amountsByMonthKey['2026-01']).toBe(1000)
    expect(r.sources[0]!.amountsByMonthKey['2026-02']).toBe(0)
  })

  it('computeIncomeSprintDerived beforeTax uses gross to date', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'plan-test-2',
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      goalBasis: 'beforeTax',
      targetAmount: 100_000,
      applyTax: true,
      taxPercent: 40,
      paidTowardGoal: 10_000,
      sources: [
        {
          id: '1',
          name: 'S1',
          amountsByMonthKey: {
            '2026-03': 50_000,
            '2026-04': 30_000,
            '2026-05': 20_000,
            '2026-06': 10_000,
          },
        },
      ],
    })
    const d = computeIncomeSprintDerived(plan, '2026-04-15')
    expect(d).not.toBeNull()
    expect(d!.earnedGrossToDate).toBe(80_000)
    expect(d!.earnedNetToDate).toBeCloseTo(80_000 * 0.6)
    expect(d!.earnedInGoalBasis).toBe(80_000)
    expect(d!.totalTowardGoal).toBe(90_000)
    expect(d!.remaining).toBe(10_000)
    expect(d!.grandGrossFull).toBe(110_000)
  })

  it('computeIncomeSprintDerived afterTax uses net to date', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'plan-test-3',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      goalBasis: 'afterTax',
      targetAmount: 60_000,
      applyTax: true,
      taxPercent: 50,
      paidTowardGoal: 0,
      sources: [
        {
          id: '1',
          name: 'S1',
          amountsByMonthKey: { '2026-03': 100_000, '2026-04': 0 },
        },
      ],
    })
    const d = computeIncomeSprintDerived(plan, '2026-03-31')
    expect(d!.earnedNetToDate).toBe(50_000)
    expect(d!.earnedInGoalBasis).toBe(50_000)
    expect(d!.remaining).toBe(10_000)
  })
})
