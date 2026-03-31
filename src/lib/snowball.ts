import type { Debt, DebtPayoffStrategy } from '@/lib/store'
import { isDebtPauseActive } from '@/lib/debtHelpers'

/** Brukerens eksplisitte valg, eller standard: boliglån utenfor snøball, øvrige typer med. */
export function effectiveIncludeInSnowball(debt: Debt): boolean {
  if (debt.includeInSnowball !== undefined) return debt.includeInSnowball
  return debt.type !== 'mortgage'
}

/** Kvalifisert til nedbetalingskø: ønsket med, ikke pause, restgjeld > 0. */
export function isDebtInSnowball(debt: Debt): boolean {
  if (!effectiveIncludeInSnowball(debt)) return false
  if (isDebtPauseActive(debt)) return false
  if (debt.remainingAmount <= 0) return false
  return true
}

export function sortPayoffQueue(debts: Debt[], strategy: DebtPayoffStrategy): Debt[] {
  const eligible = debts.filter(isDebtInSnowball)
  if (strategy === 'avalanche') {
    return [...eligible].sort((a, b) => {
      if (b.interestRate !== a.interestRate) return b.interestRate - a.interestRate
      if (b.remainingAmount !== a.remainingAmount) return b.remainingAmount - a.remainingAmount
      return a.id.localeCompare(b.id)
    })
  }
  return [...eligible].sort((a, b) => {
    if (a.remainingAmount !== b.remainingAmount) return a.remainingAmount - b.remainingAmount
    return a.id.localeCompare(b.id)
  })
}

export function getPayoffFocus(debts: Debt[], strategy: DebtPayoffStrategy): Debt | null {
  const sorted = sortPayoffQueue(debts, strategy)
  return sorted[0] ?? null
}

export function sortSnowballDebts(debts: Debt[]): Debt[] {
  return sortPayoffQueue(debts, 'snowball')
}

export function getSnowballFocus(debts: Debt[]): Debt | null {
  return getPayoffFocus(debts, 'snowball')
}

/** Gjeld som vises som «utenfor køen»: ikke kvalifisert, men fortsatt med rest eller relevant. */
export function debtsExcludedFromSnowballQueue(debts: Debt[]): Debt[] {
  return debts.filter((d) => !isDebtInSnowball(d) && d.remainingAmount > 0)
}
