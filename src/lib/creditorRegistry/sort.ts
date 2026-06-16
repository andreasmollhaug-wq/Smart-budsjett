import { computeGroupTotals } from './aggregate'
import type {
  CreditorRegistryGroup,
  CreditorRegistryLoan,
  CreditorSortMode,
  LoanSortMode,
} from './types'

export const CREDITOR_SORT_MODES: CreditorSortMode[] = [
  'name_asc',
  'remaining_desc',
  'remaining_asc',
  'monthly_desc',
  'loanCount_desc',
]

export const CREDITOR_SORT_LABELS: Record<CreditorSortMode, string> = {
  name_asc: 'Navn (A–Å)',
  remaining_desc: 'Restgjeld (størst først)',
  remaining_asc: 'Restgjeld (minst først)',
  monthly_desc: 'Månedlig avdrag (høyest først)',
  loanCount_desc: 'Flest lån først',
}

export const LOAN_SORT_MODES: LoanSortMode[] = [
  'name_asc',
  'remaining_desc',
  'remaining_asc',
  'interest_desc',
  'monthly_desc',
]

export const LOAN_SORT_LABELS: Record<LoanSortMode, string> = {
  name_asc: 'Navn (A–Å)',
  remaining_desc: 'Restgjeld (størst først)',
  remaining_asc: 'Restgjeld (minst først)',
  interest_desc: 'Rente (høyest først)',
  monthly_desc: 'Månedlig avdrag (høyest først)',
}

/** Én sortering i UI — mapper til kreditor- og lånsortering. */
export type RegistrySortPreset =
  | 'name_asc'
  | 'remaining_desc'
  | 'remaining_asc'
  | 'monthly_desc'
  | 'loanCount_desc'
  | 'interest_desc'

export const REGISTRY_SORT_PRESETS: RegistrySortPreset[] = [
  'name_asc',
  'remaining_desc',
  'remaining_asc',
  'monthly_desc',
  'loanCount_desc',
  'interest_desc',
]

export const REGISTRY_SORT_LABELS: Record<RegistrySortPreset, string> = {
  name_asc: 'Navn (A–Å)',
  remaining_desc: 'Restgjeld (størst først)',
  remaining_asc: 'Restgjeld (minst først)',
  monthly_desc: 'Månedlig avdrag (høyest først)',
  loanCount_desc: 'Flest lån per kreditor',
  interest_desc: 'Rente (høyest først)',
}

export function sortPrefsFromPreset(preset: RegistrySortPreset): {
  creditorSort: CreditorSortMode
  loanSort: LoanSortMode
} {
  switch (preset) {
    case 'name_asc':
      return { creditorSort: 'name_asc', loanSort: 'name_asc' }
    case 'remaining_desc':
      return { creditorSort: 'remaining_desc', loanSort: 'remaining_desc' }
    case 'remaining_asc':
      return { creditorSort: 'remaining_asc', loanSort: 'remaining_asc' }
    case 'monthly_desc':
      return { creditorSort: 'monthly_desc', loanSort: 'monthly_desc' }
    case 'loanCount_desc':
      return { creditorSort: 'loanCount_desc', loanSort: 'remaining_desc' }
    case 'interest_desc':
      return { creditorSort: 'name_asc', loanSort: 'interest_desc' }
    default: {
      const _exhaustive: never = preset
      return _exhaustive
    }
  }
}

export function inferSortPreset(
  creditorSort: CreditorSortMode,
  loanSort: LoanSortMode,
): RegistrySortPreset {
  if (loanSort === 'interest_desc') return 'interest_desc'
  if (creditorSort === 'loanCount_desc') return 'loanCount_desc'
  if (
    creditorSort === loanSort &&
    (creditorSort === 'name_asc' ||
      creditorSort === 'remaining_desc' ||
      creditorSort === 'remaining_asc' ||
      creditorSort === 'monthly_desc')
  ) {
    return creditorSort
  }
  return 'name_asc'
}

function cmpName(a: string, b: string): number {
  return a.localeCompare(b, 'nb-NO', { sensitivity: 'base' })
}

function tieNameThenId(
  a: { name: string; id: string },
  b: { name: string; id: string },
): number {
  const c = cmpName(a.name, b.name)
  return c !== 0 ? c : a.id.localeCompare(b.id)
}

export function sortLoans(loans: CreditorRegistryLoan[], mode: LoanSortMode): CreditorRegistryLoan[] {
  return loans.slice().sort((a, b) => {
    switch (mode) {
      case 'name_asc':
        return tieNameThenId(a, b)
      case 'remaining_desc':
        if (a.remainingAmount !== b.remainingAmount) return b.remainingAmount - a.remainingAmount
        return tieNameThenId(a, b)
      case 'remaining_asc':
        if (a.remainingAmount !== b.remainingAmount) return a.remainingAmount - b.remainingAmount
        return tieNameThenId(a, b)
      case 'interest_desc':
        if (a.interestRate !== b.interestRate) return b.interestRate - a.interestRate
        return tieNameThenId(a, b)
      case 'monthly_desc':
        if (a.monthlyPayment !== b.monthlyPayment) return b.monthlyPayment - a.monthlyPayment
        return tieNameThenId(a, b)
      default: {
        const _exhaustive: never = mode
        return _exhaustive
      }
    }
  })
}

export function sortCreditorGroups(
  groups: CreditorRegistryGroup[],
  mode: CreditorSortMode,
): CreditorRegistryGroup[] {
  return groups.slice().sort((a, b) => {
    const ta = computeGroupTotals(a)
    const tb = computeGroupTotals(b)
    switch (mode) {
      case 'name_asc':
        return tieNameThenId(a, b)
      case 'remaining_desc':
        if (ta.totalRemaining !== tb.totalRemaining) return tb.totalRemaining - ta.totalRemaining
        return tieNameThenId(a, b)
      case 'remaining_asc':
        if (ta.totalRemaining !== tb.totalRemaining) return ta.totalRemaining - tb.totalRemaining
        return tieNameThenId(a, b)
      case 'monthly_desc':
        if (ta.totalMonthly !== tb.totalMonthly) return tb.totalMonthly - ta.totalMonthly
        return tieNameThenId(a, b)
      case 'loanCount_desc':
        if (ta.loanCount !== tb.loanCount) return tb.loanCount - ta.loanCount
        return tieNameThenId(a, b)
      default: {
        const _exhaustive: never = mode
        return _exhaustive
      }
    }
  })
}
