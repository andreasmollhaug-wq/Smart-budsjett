import {
  CREDITOR_REGISTRY_LOAN_TYPES,
  type CreditorRegistryChecklistOverrides,
  type CreditorRegistryChecklistStepId,
  type CreditorRegistryGroup,
  type CreditorRegistryLoan,
  type CreditorRegistryLoanType,
  type CreditorRegistryState,
} from './types'
import { computeRegistryOverview } from './aggregate'
import { reconcileCreditorRegistryChecklist } from './checklist'
import { mergePatchIntoCreditorRegistryPrefs, normalizeCreditorRegistryPrefs } from './prefs'

const LOAN_TYPE_SET = new Set<string>(CREDITOR_REGISTRY_LOAN_TYPES)

const CHECKLIST_STEP_IDS: CreditorRegistryChecklistStepId[] = [
  'first_creditor_and_loan',
  'complete_loan_fields',
  'all_creditors',
  'review_subtotals',
  'understand_standalone',
]

function clampNonNegative(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return Math.max(0, v)
}

function normalizeLoanType(raw: unknown): CreditorRegistryLoanType {
  return typeof raw === 'string' && LOAN_TYPE_SET.has(raw) ? (raw as CreditorRegistryLoanType) : 'loan'
}

export function normalizeCreditorRegistryLoan(raw: unknown): CreditorRegistryLoan | null {
  if (raw === null || typeof raw !== 'object') return null
  const o = raw as Partial<CreditorRegistryLoan>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!id || !name) return null
  return {
    id,
    name,
    remainingAmount: clampNonNegative(o.remainingAmount),
    monthlyPayment: clampNonNegative(o.monthlyPayment),
    interestRate: clampNonNegative(o.interestRate),
    type: normalizeLoanType(o.type),
    note: typeof o.note === 'string' && o.note.trim() ? o.note.trim() : undefined,
  }
}

export function normalizeCreditorRegistryGroup(raw: unknown): CreditorRegistryGroup | null {
  if (raw === null || typeof raw !== 'object') return null
  const o = raw as Partial<CreditorRegistryGroup>
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!id || !name) return null
  const loansRaw = Array.isArray(o.loans) ? o.loans : []
  const loans = loansRaw
    .map(normalizeCreditorRegistryLoan)
    .filter((l): l is CreditorRegistryLoan => l !== null)
  return { id, name, loans }
}

function normalizeChecklistOverrides(raw: unknown): CreditorRegistryChecklistOverrides {
  if (raw === null || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const out: CreditorRegistryChecklistOverrides = {}
  for (const id of CHECKLIST_STEP_IDS) {
    if (o[id] === true) out[id] = true
  }
  if (
    (o.first_creditor === true || o.first_loan === true) &&
    out.first_creditor_and_loan !== true
  ) {
    out.first_creditor_and_loan = true
  }
  return out
}

export function normalizeCreditorRegistry(raw: unknown): CreditorRegistryState {
  if (raw === null || typeof raw !== 'object') {
    return { creditors: [], prefs: normalizeCreditorRegistryPrefs(undefined) }
  }
  const o = raw as Partial<CreditorRegistryState>
  const creditorsRaw = Array.isArray(o.creditors) ? o.creditors : []
  const creditors = creditorsRaw
    .map(normalizeCreditorRegistryGroup)
    .filter((g): g is CreditorRegistryGroup => g !== null)
  let state: CreditorRegistryState = {
    creditors,
    prefs: normalizeCreditorRegistryPrefs(o.prefs),
    checklistOverrides: normalizeChecklistOverrides(o.checklistOverrides),
  }
  const overview = computeRegistryOverview(creditors)
  if (overview.creditorCount === 0) {
    state = reconcileCreditorRegistryChecklist(state, 'creditor_removed')
  } else if (overview.loanCount === 0) {
    state = reconcileCreditorRegistryChecklist(state, 'loan_removed')
  }
  return state
}

export function mergeCreditorRegistryPrefs(
  state: CreditorRegistryState,
  patch: Partial<import('./types').CreditorRegistryPrefs>,
): CreditorRegistryState {
  return {
    ...state,
    prefs: mergePatchIntoCreditorRegistryPrefs(state.prefs, patch),
  }
}
