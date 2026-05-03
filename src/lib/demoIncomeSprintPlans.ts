import {
  computeIncomeSprintDerived,
  listMonthKeysInRange,
  reconcileIncomeSprintPlan,
  type IncomeSprintPaidLine,
  type IncomeSprintPlan,
} from '@/lib/incomeSprint'
import { getDemoIncomePatternForVariant } from '@/lib/demoPersonVariants'

function monthKeysForYear(year: number): string[] {
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  return listMonthKeysInRange(start, end)
}

type SprintDemoShapeRow = {
  planName: string
  monthlySurplusBrutto: number
  bonusExtraBrutto: number
  planTaxPercent: number
  bonusSourceTaxPercent: number
  targetAmount: number
  paidTowardGoal: number
  paidNormalMonth: number
  /** Innbetalt i bonusmåned (typisk litt høyere etter ekstra sparing). */
  paidBonusMonth: number
  bonusExtraSourceLabel: string
}

/**
 * Tall tunet til representativ KPI (YTD mai, afterTax): paidTotalToDate <= earnedInGoalBasis før bonusmåned.
 * Fullår fortsatt med meningsfull målrest — justert via tester.
 */
const DEMO_SMART_SPARE_SHAPE: Record<0 | 1 | 2 | 3 | 4, SprintDemoShapeRow> = {
  0: {
    planName: 'Egenkapital buffer',
    monthlySurplusBrutto: 22_000,
    bonusExtraBrutto: 52_000,
    planTaxPercent: 37,
    bonusSourceTaxPercent: 39,
    targetAmount: 168_000,
    paidTowardGoal: 4_500,
    paidNormalMonth: 12_800,
    paidBonusMonth: 21_000,
    bonusExtraSourceLabel: 'Ekstra i feriemåned',
  },
  1: {
    planName: 'Kontantbuffer',
    monthlySurplusBrutto: 12_800,
    bonusExtraBrutto: 27_000,
    planTaxPercent: 37,
    bonusSourceTaxPercent: 39,
    targetAmount: 94_000,
    paidTowardGoal: 2_000,
    paidNormalMonth: 7_400,
    paidBonusMonth: 13_800,
    bonusExtraSourceLabel: 'Ekstra i feriemåned',
  },
  2: {
    planName: 'Buffer og målspar',
    monthlySurplusBrutto: 30_000,
    bonusExtraBrutto: 76_000,
    planTaxPercent: 37,
    bonusSourceTaxPercent: 39,
    targetAmount: 220_000,
    paidTowardGoal: 10_000,
    paidNormalMonth: 16_000,
    paidBonusMonth: 30_800,
    bonusExtraSourceLabel: 'Ekstra i feriemåned',
  },
  3: {
    planName: 'Sparing målrettet',
    monthlySurplusBrutto: 17_400,
    bonusExtraBrutto: 31_800,
    planTaxPercent: 37,
    bonusSourceTaxPercent: 39,
    targetAmount: 128_000,
    paidTowardGoal: 3_500,
    paidNormalMonth: 9_700,
    paidBonusMonth: 19_600,
    bonusExtraSourceLabel: 'Ekstra utbetaling',
  },
  4: {
    planName: 'Egenkapital og fond',
    monthlySurplusBrutto: 19_800,
    bonusExtraBrutto: 44_000,
    planTaxPercent: 37,
    bonusSourceTaxPercent: 39,
    targetAmount: 148_000,
    paidTowardGoal: 4_500,
    paidNormalMonth: 11_100,
    paidBonusMonth: 22_400,
    bonusExtraSourceLabel: 'Ekstra i feriemåned',
  },
}

/**
 * Én eksempel-SmartSpare-plan per budsjettprofil i demodata.
 * `plan.id` er unik per `profileId` (påkrevd i flerprofil-husholdning).
 */
export function buildDemoIncomeSprintPlansForYear(
  year: number,
  variantIndex: number,
  profileId: string,
): IncomeSprintPlan[] {
  const v = Math.min(Math.max(0, Math.floor(variantIndex)), 4) as 0 | 1 | 2 | 3 | 4
  const shape = DEMO_SMART_SPARE_SHAPE[v]
  const incomePattern = getDemoIncomePatternForVariant(v)
  const bonusMonthKey = `${year}-${String(incomePattern.bonusMonthIndex + 1).padStart(2, '0')}`

  const keys = monthKeysForYear(year)

  const amountsMonthly: Record<string, number> = {}
  const amountsBonusExtra: Record<string, number> = {}
  const paidByMonthKey: Record<string, number> = {}

  const srcMonthlyId = `${profileId}:ss-m`
  const srcBonusId = `${profileId}:ss-b`

  for (const k of keys) {
    amountsMonthly[k] = shape.monthlySurplusBrutto
    amountsBonusExtra[k] = k === bonusMonthKey ? shape.bonusExtraBrutto : 0
    paidByMonthKey[k] = k === bonusMonthKey ? shape.paidBonusMonth : shape.paidNormalMonth
  }

  const bonusPaidHalf = Math.floor(shape.paidBonusMonth / 2)
  const bonusPaidRemainder = shape.paidBonusMonth - bonusPaidHalf
  const demoBonusPaidLines: IncomeSprintPaidLine[] = [
    {
      id: `${profileId}:ss-paid-demo-1`,
      amount: bonusPaidHalf,
      createdAt: `${bonusMonthKey}-05T09:30:00.000Z`,
      note: 'Demo: første innbetaling',
    },
    {
      id: `${profileId}:ss-paid-demo-2`,
      amount: bonusPaidRemainder,
      createdAt: `${bonusMonthKey}-21T13:45:00.000Z`,
      note: 'Demo: påfyll',
    },
  ]

  const raw: IncomeSprintPlan = {
    id: `demo-smartspare-${profileId}`,
    name: shape.planName,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    goalBasis: 'afterTax',
    targetAmount: shape.targetAmount,
    applyTax: true,
    taxPercent: shape.planTaxPercent,
    paidTowardGoal: shape.paidTowardGoal,
    paidByMonthKey,
    paidLinesByMonthKey: { [bonusMonthKey]: demoBonusPaidLines },
    sources: [
      {
        id: srcMonthlyId,
        name: 'Månedlig overskudd',
        amountsByMonthKey: amountsMonthly,
      },
      {
        id: srcBonusId,
        name: shape.bonusExtraSourceLabel,
        taxPercent: shape.bonusSourceTaxPercent,
        amountsByMonthKey: amountsBonusExtra,
      },
    ],
  }

  return [reconcileIncomeSprintPlan(raw)]
}

const DEFAULT_SAMPLE_PROFILE_ID = 'demo-ss-sample-profile'

/** Brukes i tester og verifikasjon uten å duplikere mål/tall-logikk. */
export function demoSmartSpareSampleDerived(year: number, profileId = DEFAULT_SAMPLE_PROFILE_ID) {
  const [plan] = buildDemoIncomeSprintPlansForYear(year, 0, profileId)
  const referenceDate = `${year}-05-31`
  const kpi = {
    filterYear: year,
    periodMode: 'ytd' as const,
    monthIndex: 4,
  }
  const d = computeIncomeSprintDerived(plan, referenceDate, kpi)
  return { plan, derived: d, referenceDate, kpi }
}
