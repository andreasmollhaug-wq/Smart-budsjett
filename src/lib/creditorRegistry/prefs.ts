import type { CreditorRegistryPrefs, CreditorSortMode, LoanSortMode } from './types'

export const DEFAULT_CREDITOR_REGISTRY_PREFS: CreditorRegistryPrefs = {
  creditorSort: 'name_asc',
  loanSort: 'remaining_desc',
}

const CREDITOR_SORT_WHITELIST = new Set<string>([
  'name_asc',
  'remaining_desc',
  'remaining_asc',
  'monthly_desc',
  'loanCount_desc',
])

const LOAN_SORT_WHITELIST = new Set<string>([
  'name_asc',
  'remaining_desc',
  'remaining_asc',
  'interest_desc',
  'monthly_desc',
])

export function normalizeCreditorRegistryPrefs(raw: unknown): CreditorRegistryPrefs {
  const d =
    raw !== null && typeof raw === 'object' ? (raw as Partial<CreditorRegistryPrefs>) : {}

  let creditorSort = DEFAULT_CREDITOR_REGISTRY_PREFS.creditorSort
  if (typeof d.creditorSort === 'string' && CREDITOR_SORT_WHITELIST.has(d.creditorSort)) {
    creditorSort = d.creditorSort as CreditorSortMode
  }

  let loanSort = DEFAULT_CREDITOR_REGISTRY_PREFS.loanSort
  if (typeof d.loanSort === 'string' && LOAN_SORT_WHITELIST.has(d.loanSort)) {
    loanSort = d.loanSort as LoanSortMode
  }

  return {
    creditorSort,
    loanSort,
    hasReviewedSubtotals: d.hasReviewedSubtotals === true,
    standaloneInfoAcknowledged: d.standaloneInfoAcknowledged === true,
    checklistDismissed: d.checklistDismissed === true,
    checklistCollapsed: d.checklistCollapsed === true,
  }
}

export function mergePatchIntoCreditorRegistryPrefs(
  existing: CreditorRegistryPrefs | undefined,
  patch: Partial<CreditorRegistryPrefs>,
): CreditorRegistryPrefs {
  return normalizeCreditorRegistryPrefs({
    ...(existing !== undefined ? existing : {}),
    ...patch,
  })
}
