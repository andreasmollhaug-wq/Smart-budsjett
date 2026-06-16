import type { CreditorRegistryGroup, CreditorRegistryLoan } from './types'

export type CreditorGroupTotals = {
  loanCount: number
  totalRemaining: number
  totalMonthly: number
  totalAnnualInterest: number
  highestInterestRate: number
}

export type CreditorRegistryOverview = {
  creditorCount: number
  loanCount: number
  totalRemaining: number
  totalMonthly: number
  totalAnnualInterest: number
}

function annualInterestForLoan(loan: CreditorRegistryLoan): number {
  return (loan.remainingAmount * loan.interestRate) / 100
}

export function computeGroupTotals(group: CreditorRegistryGroup): CreditorGroupTotals {
  let totalRemaining = 0
  let totalMonthly = 0
  let totalAnnualInterest = 0
  let highestInterestRate = 0

  for (const loan of group.loans) {
    totalRemaining += loan.remainingAmount
    totalMonthly += loan.monthlyPayment
    totalAnnualInterest += annualInterestForLoan(loan)
    if (loan.interestRate > highestInterestRate) highestInterestRate = loan.interestRate
  }

  return {
    loanCount: group.loans.length,
    totalRemaining,
    totalMonthly,
    totalAnnualInterest,
    highestInterestRate,
  }
}

export function computeRegistryOverview(creditors: CreditorRegistryGroup[]): CreditorRegistryOverview {
  let loanCount = 0
  let totalRemaining = 0
  let totalMonthly = 0
  let totalAnnualInterest = 0

  for (const group of creditors) {
    const t = computeGroupTotals(group)
    loanCount += t.loanCount
    totalRemaining += t.totalRemaining
    totalMonthly += t.totalMonthly
    totalAnnualInterest += t.totalAnnualInterest
  }

  return {
    creditorCount: creditors.length,
    loanCount,
    totalRemaining,
    totalMonthly,
    totalAnnualInterest,
  }
}
