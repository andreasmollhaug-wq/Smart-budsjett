import { describe, expect, it } from 'vitest'
import {
  appendIncomeSprintPaidLine,
  computeIncomeSprintDerived,
  computeSourceMonthGrossTaxNet,
  ensureIncomeSprintPlanId,
  formatIncomeSprintPlanPeriodNb,
  incomeSprintPaidLinesExplicitForMonth,
  incomeSprintNormalizedPaidLinesForMonth,
  incomeSprintUserEnteredPaidLineCount,
  listMonthKeysInRange,
  monthKeyHeadingNb,
  reconcileIncomeSprintPlan,
  buildSmartSpareMonthlyPaidEarnedRows,
  maxAdditionalPaidForMonth,
  parseTaxPercentFieldInput,
  smartSpareFilterToReferenceDate,
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
      paidByMonthKey: {},
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

  it('parseTaxPercentFieldInput: klemmer og fjerner ledende nuller', () => {
    expect(parseTaxPercentFieldInput('010')).toBe(10)
    expect(parseTaxPercentFieldInput('100')).toBe(100)
    expect(parseTaxPercentFieldInput('150')).toBe(100)
    expect(parseTaxPercentFieldInput('')).toBe(0)
    expect(parseTaxPercentFieldInput('abc40x')).toBe(40)
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
      paidByMonthKey: { '2026-01': 100, '2099-12': 50 },
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
    expect(r.paidByMonthKey!['2026-01']).toBe(100)
    expect(r.paidByMonthKey!['2026-02']).toBe(0)
  })

  it('computeIncomeSprintDerived beforeTax: fremdrift kun på innbetalt', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'plan-test-2',
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      goalBasis: 'beforeTax',
      targetAmount: 100_000,
      applyTax: true,
      taxPercent: 40,
      paidTowardGoal: 10_000,
      paidByMonthKey: {},
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
    expect(d!.paidTotalToDate).toBe(10_000)
    expect(d!.totalTowardGoal).toBe(10_000)
    expect(d!.remaining).toBe(90_000)
    expect(d!.pendingNotReceived).toBe(70_000)
    expect(d!.grandGrossFull).toBe(110_000)
  })

  it('computeIncomeSprintDerived afterTax: resterende kun mot innbetalt', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'plan-test-3',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      goalBasis: 'afterTax',
      targetAmount: 60_000,
      applyTax: true,
      taxPercent: 50,
      paidTowardGoal: 0,
      paidByMonthKey: {},
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
    expect(d!.paidTotalToDate).toBe(0)
    expect(d!.remaining).toBe(60_000)
    expect(d!.pendingNotReceived).toBe(50_000)
  })

  it('paidByMonthKey summeres til innbetalt hittil', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'p',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      goalBasis: 'afterTax',
      targetAmount: 100_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 5000,
      paidByMonthKey: { '2026-01': 10_000, '2026-02': 15_000 },
      sources: [{ id: 's', name: 'S', amountsByMonthKey: { '2026-01': 20_000 } }],
    })
    const d = computeIncomeSprintDerived(plan, '2026-02-15')
    expect(d!.paidFromMonthsToDate).toBe(25_000)
    expect(d!.paidTotalToDate).toBe(30_000)
  })

  it('ulike skatteprosent per kilde', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'p',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      goalBasis: 'afterTax',
      targetAmount: 50_000,
      applyTax: true,
      taxPercent: 40,
      paidTowardGoal: 0,
      paidByMonthKey: {},
      sources: [
        { id: 'a', name: 'A', taxPercent: 50, amountsByMonthKey: { '2026-01': 100_000 } },
        { id: 'b', name: 'B', amountsByMonthKey: { '2026-01': 100_000 } },
      ],
    })
    const d = computeIncomeSprintDerived(plan, '2026-01-31')
    expect(d!.sourceTotals.find((x) => x.id === 'a')!.netFullPeriod).toBe(50_000)
    expect(d!.sourceTotals.find((x) => x.id === 'b')!.netFullPeriod).toBe(60_000)
    expect(d!.earnedNetToDate).toBe(110_000)

    const m = computeSourceMonthGrossTaxNet(plan, 'a', '2026-01')
    expect(m!.net).toBe(50_000)
    const m2 = computeSourceMonthGrossTaxNet(plan, 'b', '2026-01')
    expect(m2!.net).toBe(60_000)
  })

  it('smartSpareFilterToReferenceDate klipper mot planstart', () => {
    const plan = { startDate: '2026-02-01', endDate: '2026-12-31' }
    const ref = smartSpareFilterToReferenceDate(plan, 2026, 'month', 0)
    expect(ref).toBe('2026-02-01')
  })

  it('smartSpareFilterToReferenceDate bruker valgt måneds siste dag innenfor plan', () => {
    const plan = { startDate: '2026-01-01', endDate: '2026-12-31' }
    const ref = smartSpareFilterToReferenceDate(plan, 2026, 'month', 2)
    expect(ref).toBe('2026-03-31')
  })

  it('computeIncomeSprintDerived med KPI-filter: ekskluderer forrige års måneder ved 2026 YTD', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'cross-year',
      startDate: '2025-11-01',
      endDate: '2026-06-30',
      goalBasis: 'beforeTax',
      targetAmount: 1_000_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: {
        '2025-11': 1_000,
        '2025-12': 2_000,
        '2026-01': 3_000,
        '2026-02': 4_000,
        '2026-03': 5_000,
        '2026-04': 6_000,
      },
      sources: [
        {
          id: 's',
          name: 'S',
          amountsByMonthKey: {
            '2025-11': 10_000,
            '2025-12': 20_000,
            '2026-01': 30_000,
            '2026-02': 40_000,
            '2026-03': 50_000,
            '2026-04': 60_000,
            '2026-05': 70_000,
            '2026-06': 80_000,
          },
        },
      ],
    })
    const kpi = { filterYear: 2026, periodMode: 'ytd' as const, monthIndex: 3 }
    const d = computeIncomeSprintDerived(plan, '2026-04-30', kpi)
    expect(d).not.toBeNull()
    expect(d!.earnedGrossToDate).toBe(30_000 + 40_000 + 50_000 + 60_000)
    expect(d!.paidFromMonthsToDate).toBe(3_000 + 4_000 + 5_000 + 6_000)
  })

  it('computeIncomeSprintDerived med KPI-filter: én måned i filterår', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'one-month',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      goalBasis: 'afterTax',
      targetAmount: 100_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-01': 1, '2026-02': 2, '2026-03': 3 },
      sources: [{ id: 's', name: 'S', amountsByMonthKey: { '2026-01': 100, '2026-02': 200, '2026-03': 300 } }],
    })
    const d = computeIncomeSprintDerived(plan, '2026-03-31', {
      filterYear: 2026,
      periodMode: 'month',
      monthIndex: 1,
    })
    expect(d!.earnedNetToDate).toBe(200)
    expect(d!.paidFromMonthsToDate).toBe(2)
  })

  it('KPI hele året: summerer plan gjennom desember selv om refYm er april', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'full-year-kpi',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      goalBasis: 'beforeTax',
      targetAmount: 1_000_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: {},
      sources: [
        {
          id: 'a',
          name: 'A',
          amountsByMonthKey: {
            '2026-04': 11_000,
            '2026-05': 5_000,
            '2026-12': 999,
          },
        },
      ],
    })
    const d = computeIncomeSprintDerived(plan, '2026-04-21', {
      filterYear: 2026,
      periodMode: 'year',
      monthIndex: 0,
    })
    expect(d!.earnedGrossToDate).toBe(11_000 + 5_000 + 999)
  })

  it('KPI én måned (mai): inkluderer mai når ref-dato fortsatt er i april', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'future-month-kpi',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      goalBasis: 'beforeTax',
      targetAmount: 100_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: {},
      sources: [
        {
          id: 's1',
          name: 'S1',
          amountsByMonthKey: { '2026-04': 1_000, '2026-05': 10_000 },
        },
        {
          id: 's2',
          name: 'S2',
          amountsByMonthKey: { '2026-04': 10_000, '2026-05': 5_000 },
        },
      ],
    })
    const d = computeIncomeSprintDerived(plan, '2026-04-15', {
      filterYear: 2026,
      periodMode: 'month',
      monthIndex: 4,
    })
    expect(d!.earnedGrossToDate).toBe(5_000 + 10_000)
  })

  it('buildSmartSpareMonthlyPaidEarnedRows: opptjent og innbetalt per måned i KPI-vindu', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'rows',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      goalBasis: 'afterTax',
      targetAmount: 100_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-01': 5_000, '2026-02': 3_000 },
      sources: [
        { id: 's', name: 'S', amountsByMonthKey: { '2026-01': 10_000, '2026-02': 8_000, '2026-03': 2_000 } },
      ],
    })
    const rows = buildSmartSpareMonthlyPaidEarnedRows(plan, '2026-03-31', {
      filterYear: 2026,
      periodMode: 'month',
      monthIndex: 1,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.monthKey).toBe('2026-02')
    expect(rows[0]!.earnedInGoalBasis).toBe(8_000)
    expect(rows[0]!.paid).toBe(3_000)
    expect(rows[0]!.pendingInMonth).toBe(5_000)
  })

  it('maxAdditionalPaidForMonth: rom til innbetalt = opptjent minus paid', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'cap',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      goalBasis: 'beforeTax',
      targetAmount: 50_000,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: {},
      sources: [{ id: 's', name: 'S', amountsByMonthKey: { '2026-04': 10_000 } }],
    })
    expect(maxAdditionalPaidForMonth(plan, '2026-04')).toBe(10_000)
    const afterPaid = reconcileIncomeSprintPlan({
      ...plan,
      paidByMonthKey: { '2026-04': 10_000 },
    })
    expect(maxAdditionalPaidForMonth(afterPaid, '2026-04')).toBe(0)
    const overPaid = reconcileIncomeSprintPlan({
      ...plan,
      paidByMonthKey: { '2026-04': 12_000 },
    })
    expect(maxAdditionalPaidForMonth(overPaid, '2026-04')).toBe(0)
  })

  it('reconcileIncomeSprintPlan: ikke-tomme paidLines overskriver paidByMonthKey-sum for måneden', () => {
    const r = reconcileIncomeSprintPlan({
      id: 'lines-sum',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      goalBasis: 'beforeTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-04': 99_999 },
      paidLinesByMonthKey: {
        '2026-04': [
          { id: 'a', amount: 8_600, createdAt: '2026-04-10T10:00:00.000Z' },
          { id: 'b', amount: 2_500, createdAt: '2026-04-11T10:00:00.000Z' },
        ],
      },
      sources: [],
    })
    expect(r.paidByMonthKey!['2026-04']).toBe(11_100)
  })

  it('reconcileIncomeSprintPlan: manglende paidLines rører ikke legacy paidByMonthKey', () => {
    const r = reconcileIncomeSprintPlan({
      id: 'legacy',
      startDate: '2026-01-01',
      endDate: '2026-02-28',
      goalBasis: 'afterTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-01': 5_000, '2026-02': 3_000 },
      sources: [],
    })
    expect(r.paidByMonthKey!['2026-01']).toBe(5_000)
    expect(r.paidByMonthKey!['2026-02']).toBe(3_000)
    expect(r.paidLinesByMonthKey).toBeUndefined()
  })

  it('reconcileIncomeSprintPlan: eksplisitt tom paidLines-liste gir 0 kr for måneden', () => {
    const r = reconcileIncomeSprintPlan({
      id: 'cleared',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      goalBasis: 'afterTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-03': 9_000 },
      paidLinesByMonthKey: { '2026-03': [] },
      sources: [],
    })
    expect(r.paidByMonthKey!['2026-03']).toBe(0)
    expect(incomeSprintPaidLinesExplicitForMonth(r, '2026-03')).toBe(true)
    expect(r.paidLinesByMonthKey!['2026-03']).toEqual([])
  })

  it('appendIncomeSprintPaidLine: legger sammen med legacy uten å miste tidligere sum', () => {
    const base = reconcileIncomeSprintPlan({
      id: 'tilfor-legacy',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      goalBasis: 'beforeTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-04': 8_600 },
      sources: [{ id: 's', name: 'S', amountsByMonthKey: { '2026-04': 20_000 } }],
    })
    const next = reconcileIncomeSprintPlan(appendIncomeSprintPaidLine(base, '2026-04', 2_500))
    expect(next.paidByMonthKey!['2026-04']).toBe(11_100)
    const lines = next.paidLinesByMonthKey!['2026-04']!
    expect(lines).toHaveLength(2)
    expect(lines.reduce((s, l) => s + l.amount, 0)).toBe(11_100)
    expect(maxAdditionalPaidForMonth(next, '2026-04')).toBe(8_900)
  })

  it('incomeSprintUserEnteredPaidLineCount: syntetisk opprulling teller ikke med i «antall poster»', () => {
    const base = reconcileIncomeSprintPlan({
      id: 'count-rollup',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      goalBasis: 'beforeTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: { '2026-04': 8_600 },
      sources: [],
    })
    const oneUserLine = reconcileIncomeSprintPlan(appendIncomeSprintPaidLine(base, '2026-04', 2_500))
    expect(oneUserLine.paidLinesByMonthKey!['2026-04']).toHaveLength(2)
    expect(incomeSprintUserEnteredPaidLineCount(oneUserLine, '2026-04')).toBe(1)

    const twoUserLines = reconcileIncomeSprintPlan(appendIncomeSprintPaidLine(oneUserLine, '2026-04', 500))
    expect(incomeSprintUserEnteredPaidLineCount(twoUserLines, '2026-04')).toBe(2)
  })

  it('beløp lagret som streng i paidLines telles etter normalisering', () => {
    const r = reconcileIncomeSprintPlan({
      id: 'coerce',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      goalBasis: 'beforeTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: {},
      paidLinesByMonthKey: {
        '2026-06': [
          // Persistet JSON kan levere tall som streng; normalisering skal likevel tolke og synke summen.
          // @ts-expect-error test: beløpsfelt kan være streng fra lagring
          { id: 'a', amount: '4 000', createdAt: '2026-06-01T08:00:00.000Z' },
          { id: 'b', amount: 1000, createdAt: '2026-06-02T08:00:00.000Z' },
        ],
      },
      sources: [],
    })
    expect(incomeSprintNormalizedPaidLinesForMonth(r, '2026-06')).toHaveLength(2)
    expect(incomeSprintUserEnteredPaidLineCount(r, '2026-06')).toBe(2)
    expect(r.paidByMonthKey!['2026-06']).toBe(5_000)
  })

  it('maxAdditionalPaidForMonth med to linjer: bruker sum av paidByMonthKey', () => {
    const plan = reconcileIncomeSprintPlan({
      id: 'two-lines',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      goalBasis: 'beforeTax',
      targetAmount: 0,
      applyTax: false,
      taxPercent: 0,
      paidTowardGoal: 0,
      paidByMonthKey: {},
      paidLinesByMonthKey: {
        '2026-05': [
          { id: 'x', amount: 4_000, createdAt: '2026-05-01T08:00:00.000Z' },
          { id: 'y', amount: 1_000, createdAt: '2026-05-02T08:00:00.000Z' },
        ],
      },
      sources: [{ id: 's', name: 'S', amountsByMonthKey: { '2026-05': 10_000 } }],
    })
    expect(plan.paidByMonthKey!['2026-05']).toBe(5_000)
    expect(maxAdditionalPaidForMonth(plan, '2026-05')).toBe(5_000)
  })
})
