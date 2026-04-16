import { annualInterestCost, isDebtPauseActive, rawDebtMonthlyPayment } from '@/lib/debtHelpers'
import type { Debt, PersonData, PersonProfile } from '@/lib/store'

const DEBT_TYPES = [
  'mortgage',
  'loan',
  'consumer_loan',
  'refinancing',
  'student_loan',
  'credit_card',
  'other',
] as const satisfies readonly Debt['type'][]

export type HouseholdDebtMemberRow = {
  profileId: string
  name: string
  totalRemaining: number
  /** Sum av effektive månedlige avdrag (0 ved aktiv pause). */
  totalMonthlyEffective: number
  totalAnnualInterest: number
  highestInterestRate: number
  debtCount: number
  /** Restgjeld per lånetype (for grafer). */
  remainingByType: Record<Debt['type'], number>
}

export type HouseholdDebtOverviewResult = {
  household: {
    totalRemaining: number
    totalMonthlyEffective: number
    totalAnnualInterest: number
    highestInterestRate: number
    debtCount: number
    remainingByType: Record<Debt['type'], number>
  }
  members: HouseholdDebtMemberRow[]
}

function emptyRemainingByType(): Record<Debt['type'], number> {
  const o = {} as Record<Debt['type'], number>
  for (const t of DEBT_TYPES) {
    o[t] = 0
  }
  return o
}

/** Effektiv månedlig betaling: 0 når avdrag er pauset (som i snøball-kø). */
export function effectiveDebtMonthlyPayment(debt: Debt): number {
  if (isDebtPauseActive(debt)) return 0
  return rawDebtMonthlyPayment(debt)
}

function accumulateDebt(debt: Debt, into: HouseholdDebtMemberRow): void {
  into.totalRemaining += debt.remainingAmount
  into.totalMonthlyEffective += effectiveDebtMonthlyPayment(debt)
  into.totalAnnualInterest += annualInterestCost(debt)
  if (debt.interestRate > into.highestInterestRate) into.highestInterestRate = debt.interestRate
  into.debtCount += 1
  into.remainingByType[debt.type] = (into.remainingByType[debt.type] ?? 0) + debt.remainingAmount
}

/**
 * Summer gjeld per profil og for hele husholdningen. Leser rå `PersonData.debts` per profil
 * (ikke husholdningsaggregat med prefiksede id-er).
 */
export function buildHouseholdDebtOverview(
  people: Record<string, PersonData>,
  profiles: PersonProfile[],
): HouseholdDebtOverviewResult {
  const members: HouseholdDebtMemberRow[] = []
  const householdRemainingByType = emptyRemainingByType()

  let householdTotalRemaining = 0
  let householdTotalMonthly = 0
  let householdTotalAnnualInterest = 0
  let householdHighestRate = 0
  let householdDebtCount = 0

  for (const p of profiles) {
    const row: HouseholdDebtMemberRow = {
      profileId: p.id,
      name: p.name?.trim() || 'Profil',
      totalRemaining: 0,
      totalMonthlyEffective: 0,
      totalAnnualInterest: 0,
      highestInterestRate: 0,
      debtCount: 0,
      remainingByType: emptyRemainingByType(),
    }

    const list = people[p.id]?.debts ?? []
    for (const d of list) {
      accumulateDebt(d, row)
    }

    householdTotalRemaining += row.totalRemaining
    householdTotalMonthly += row.totalMonthlyEffective
    householdTotalAnnualInterest += row.totalAnnualInterest
    householdDebtCount += row.debtCount
    if (row.highestInterestRate > householdHighestRate) householdHighestRate = row.highestInterestRate
    for (const t of DEBT_TYPES) {
      householdRemainingByType[t] += row.remainingByType[t] ?? 0
    }

    members.push(row)
  }

  return {
    household: {
      totalRemaining: householdTotalRemaining,
      totalMonthlyEffective: householdTotalMonthly,
      totalAnnualInterest: householdTotalAnnualInterest,
      highestInterestRate: householdDebtCount > 0 ? householdHighestRate : 0,
      debtCount: householdDebtCount,
      remainingByType: householdRemainingByType,
    },
    members,
  }
}

export const householdDebtTypeOrder = DEBT_TYPES
