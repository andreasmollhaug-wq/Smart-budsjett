import { describe, expect, it } from 'vitest'
import { buildDemoIncomeSprintPlansForYear, demoSmartSpareSampleDerived } from './demoIncomeSprintPlans'
import { getDemoIncomePatternForVariant } from './demoPersonVariants'
import { computeIncomeSprintDerived } from './incomeSprint'

const MAY_YTD_KPI = (year: number) =>
  ({
    filterYear: year,
    periodMode: 'ytd' as const,
    monthIndex: 4,
  }) as const

function assertMayYtdPaidVsEarned(year: number, variantIndex: number, profileId: string) {
  const [plan] = buildDemoIncomeSprintPlansForYear(year, variantIndex, profileId)
  const referenceDate = `${year}-05-31`
  const d = computeIncomeSprintDerived(plan, referenceDate, MAY_YTD_KPI(year))
  expect(d).not.toBeNull()
  expect(d!.paidTotalToDate).toBeLessThanOrEqual(d!.earnedInGoalBasis)
  expect(d!.pendingNotReceived).toBeGreaterThanOrEqual(0)
  const ratio = d!.earnedInGoalBasis > 0 ? d!.paidTotalToDate / d!.earnedInGoalBasis : 0
  expect(ratio).toBeGreaterThanOrEqual(0.58)
  expect(ratio).toBeLessThanOrEqual(0.99)
  expect(d!.progressPercent).toBeGreaterThanOrEqual(40)
  expect(d!.progressPercent).toBeLessThanOrEqual(72)
}

describe('buildDemoIncomeSprintPlansForYear', () => {
  it('alle varianter 0–4 gir én plan med unik id per profileId', () => {
    const y = 2026
    const a = buildDemoIncomeSprintPlansForYear(y, 0, 'pid-a')
    const b = buildDemoIncomeSprintPlansForYear(y, 0, 'pid-b')
    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    expect(a[0]!.id).toBe('demo-smartspare-pid-a')
    expect(b[0]!.id).toBe('demo-smartspare-pid-b')
    expect(a[0]!.id).not.toBe(b[0]!.id)
  })

  it('variant 0 gir helårsplan med to kilder og 12 måneder', () => {
    const y = 2027
    const plans = buildDemoIncomeSprintPlansForYear(y, 0, 'p0')
    expect(plans).toHaveLength(1)
    const [p] = plans
    expect(p?.startDate).toBe(`${y}-01-01`)
    expect(p?.endDate).toBe(`${y}-12-31`)
    expect(p?.sources.length).toBeGreaterThanOrEqual(2)
    expect(Object.keys(p?.sources[0]?.amountsByMonthKey ?? {}).length).toBe(12)
    const incomePattern = getDemoIncomePatternForVariant(0)
    const bonusKey = `${y}-${String(incomePattern.bonusMonthIndex + 1).padStart(2, '0')}`
    expect(p!.paidLinesByMonthKey?.[bonusKey]?.length).toBe(2)
  })

  it('variant 3: ekstra-kilde har brutto kun i november for gitt år', () => {
    const y = 2028
    const [p] = buildDemoIncomeSprintPlansForYear(y, 3, 'p-nov')
    const bonusSrc = p!.sources.find((s) => s.name === 'Ekstra utbetaling')
    expect(bonusSrc).toBeDefined()
    for (const [key, v] of Object.entries(bonusSrc!.amountsByMonthKey)) {
      if (key === `${y}-11`) expect(v).toBeGreaterThan(0)
      else expect(v).toBe(0)
    }
  })

  it('mai-YTD: innbetalt overstiger ikke tjent (afterTax) for varianter 0–4', () => {
    const year = 2026
    for (let v = 0; v <= 4; v++) {
      assertMayYtdPaidVsEarned(year, v, `prof-v${v}`)
    }
  })

  it('demoSmartSpareSampleDerived: KPI helse for variant 0', () => {
    const { derived, plan } = demoSmartSpareSampleDerived(2026)
    expect(derived).not.toBeNull()
    expect(derived!.remaining).toBeGreaterThanOrEqual(0)
    expect(derived!.paidTotalToDate).toBeLessThanOrEqual(derived!.earnedInGoalBasis)
    expect(plan.targetAmount).toBeGreaterThan(0)
    expect((plan.paidByMonthKey ?? {})[`2026-01`]).toBeGreaterThan(0)
  })
})
