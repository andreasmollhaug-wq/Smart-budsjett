import type { Debt } from '@/lib/store'

/** Avtalt månedlig avdrag (uten pause) — brukes til budsjett-synk per måned. */
export function rawDebtMonthlyPayment(debt: Debt): number {
  const m = debt.monthlyPayment
  return Number.isFinite(m) && m >= 0 ? m : 0
}

/** Uendelig avdragspause: avkrysset uten sluttdato. */
export function debtHasIndefinitePause(debt: Debt): boolean {
  return !!(debt.repaymentPaused && !debt.pauseEndDate?.trim())
}

/**
 * Første kalenderdag avdrag kan planlegges etter pause.
 * `null` = aldri (uendelig pause). Uten `pauseEndDate` (og ikke uendelig) = tidlig dato så alle måneder kvalifiserer.
 */
export function debtRepaymentFirstEligibleDay(debt: Debt): Date | null {
  if (debtHasIndefinitePause(debt)) return null
  const ped = debt.pauseEndDate?.trim()
  if (ped) {
    const end = new Date(ped + 'T12:00:00')
    const resume = new Date(end)
    resume.setDate(resume.getDate() + 1)
    resume.setHours(0, 0, 0, 0)
    return resume
  }
  const d = new Date(1900, 0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Siste kalenderdag i måneden (month1 = 1–12). */
export function lastCalendarDayOfMonth(budgetYear: number, month1: number): Date {
  const m = Math.min(12, Math.max(1, Math.floor(month1)))
  return new Date(budgetYear, m, 0)
}

/**
 * Om denne kalendermåneden i budsjettår kan ha avdrag (siste dag i måned ≥ første avdragsdag etter pause).
 */
export function isDebtBudgetMonthPaying(debt: Debt, budgetYear: number, month1: number): boolean {
  const resume = debtRepaymentFirstEligibleDay(debt)
  if (resume === null) return false
  const last = lastCalendarDayOfMonth(budgetYear, month1)
  last.setHours(0, 0, 0, 0)
  const r = new Date(resume)
  r.setHours(0, 0, 0, 0)
  return last.getTime() >= r.getTime()
}

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
