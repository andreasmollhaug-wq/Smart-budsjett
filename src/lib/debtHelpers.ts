import type { Debt } from '@/lib/store'

/** Pause regnes som aktiv hvis bruker har huket av, eller sluttdato er i dag eller frem i tid. */
export function isDebtPauseActive(debt: Debt): boolean {
  if (debt.repaymentPaused) return true
  if (debt.pauseEndDate) {
    const end = new Date(debt.pauseEndDate + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return end >= today
  }
  return false
}

/** Ca. årlig rentekostnad (restgjeld × rente / 100) per lån. */
export function annualInterestCost(debt: Debt): number {
  return (debt.remainingAmount * debt.interestRate) / 100
}
