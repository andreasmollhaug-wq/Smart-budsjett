import { generateId } from '@/lib/utils'
import { reconcileCreditorRegistryChecklist } from './checklist'
import { mergeCreditorRegistryPrefs, normalizeCreditorRegistry } from './normalize'
import { normalizeCreditorRegistryLoan } from './normalize'
import type {
  CreditorRegistryActionResult,
  CreditorRegistryChecklistStepId,
  CreditorRegistryLoan,
  CreditorRegistryPrefs,
  CreditorRegistryState,
} from './types'

export function emptyCreditorRegistryState(): CreditorRegistryState {
  return normalizeCreditorRegistry(undefined)
}

function clampNonNegative(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return Math.max(0, v)
}

export function patchCreditorRegistry(
  state: CreditorRegistryState | undefined,
  updater: (current: CreditorRegistryState) => CreditorRegistryState,
): CreditorRegistryState {
  const current = normalizeCreditorRegistry(state)
  return normalizeCreditorRegistry(updater(current))
}

export function addCreditorGroupToRegistry(
  state: CreditorRegistryState | undefined,
  name: string,
): { next: CreditorRegistryState; id: string } | { error: 'empty_name' } {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'empty_name' }
  const id = generateId()
  const next = patchCreditorRegistry(state, (cur) => ({
    ...cur,
    creditors: [...cur.creditors, { id, name: trimmed, loans: [] }],
  }))
  return { next, id }
}

export function renameCreditorGroupInRegistry(
  state: CreditorRegistryState | undefined,
  creditorId: string,
  name: string,
): { next: CreditorRegistryState } | { error: 'not_found' | 'empty_name' } {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'empty_name' }
  const current = normalizeCreditorRegistry(state)
  const idx = current.creditors.findIndex((c) => c.id === creditorId)
  if (idx < 0) return { error: 'not_found' }
  const next = patchCreditorRegistry(state, (cur) => ({
    ...cur,
    creditors: cur.creditors.map((c) => (c.id === creditorId ? { ...c, name: trimmed } : c)),
  }))
  return { next }
}

export function removeCreditorGroupFromRegistry(
  state: CreditorRegistryState | undefined,
  creditorId: string,
): { next: CreditorRegistryState } | { error: 'not_found' } {
  const current = normalizeCreditorRegistry(state)
  if (!current.creditors.some((c) => c.id === creditorId)) return { error: 'not_found' }
  const next = patchCreditorRegistry(state, (cur) => ({
    ...cur,
    creditors: cur.creditors.filter((c) => c.id !== creditorId),
  }))
  return { next: reconcileCreditorRegistryChecklist(next, 'creditor_removed') }
}

export type CreditorRegistryLoanInput = Omit<CreditorRegistryLoan, 'id'>

export function addLoanToCreditorRegistry(
  state: CreditorRegistryState | undefined,
  creditorId: string,
  loanIn: CreditorRegistryLoanInput,
): { next: CreditorRegistryState; id: string } | { error: 'not_found' | 'invalid' } {
  const name = loanIn.name?.trim()
  if (!name || loanIn.remainingAmount <= 0) return { error: 'invalid' }
  const current = normalizeCreditorRegistry(state)
  if (!current.creditors.some((c) => c.id === creditorId)) return { error: 'not_found' }
  const id = generateId()
  const loan: CreditorRegistryLoan = {
    id,
    name,
    remainingAmount: clampNonNegative(loanIn.remainingAmount),
    monthlyPayment: clampNonNegative(loanIn.monthlyPayment),
    interestRate: clampNonNegative(loanIn.interestRate),
    type: loanIn.type,
    note: loanIn.note?.trim() || undefined,
  }
  const next = patchCreditorRegistry(state, (cur) => ({
    ...cur,
    creditors: cur.creditors.map((c) =>
      c.id === creditorId ? { ...c, loans: [...c.loans, loan] } : c,
    ),
  }))
  return { next, id }
}

export function updateLoanInCreditorRegistry(
  state: CreditorRegistryState | undefined,
  creditorId: string,
  loanId: string,
  patch: Partial<CreditorRegistryLoanInput>,
): { next: CreditorRegistryState } | { error: 'not_found' | 'invalid' } {
  const current = normalizeCreditorRegistry(state)
  const group = current.creditors.find((c) => c.id === creditorId)
  const existing = group?.loans.find((l) => l.id === loanId)
  if (!group || !existing) return { error: 'not_found' }

  const merged = {
    ...existing,
    ...patch,
    id: existing.id,
    name: patch.name !== undefined ? patch.name.trim() || existing.name : existing.name,
    remainingAmount:
      patch.remainingAmount !== undefined
        ? clampNonNegative(patch.remainingAmount)
        : existing.remainingAmount,
    monthlyPayment:
      patch.monthlyPayment !== undefined
        ? clampNonNegative(patch.monthlyPayment)
        : existing.monthlyPayment,
    interestRate:
      patch.interestRate !== undefined ? clampNonNegative(patch.interestRate) : existing.interestRate,
    note: patch.note !== undefined ? patch.note.trim() || undefined : existing.note,
    type: patch.type !== undefined ? patch.type : existing.type,
  }

  if (!merged.name.trim() || merged.remainingAmount <= 0) return { error: 'invalid' }

  const normalized = normalizeCreditorRegistryLoan(merged)
  if (!normalized) return { error: 'invalid' }

  const next = patchCreditorRegistry(state, (cur) => ({
    ...cur,
    creditors: cur.creditors.map((c) =>
      c.id === creditorId
        ? { ...c, loans: c.loans.map((l) => (l.id === loanId ? normalized : l)) }
        : c,
    ),
  }))
  return { next }
}

export function removeLoanFromCreditorRegistry(
  state: CreditorRegistryState | undefined,
  creditorId: string,
  loanId: string,
): { next: CreditorRegistryState } | { error: 'not_found' } {
  const current = normalizeCreditorRegistry(state)
  const group = current.creditors.find((c) => c.id === creditorId)
  if (!group?.loans.some((l) => l.id === loanId)) return { error: 'not_found' }
  const next = patchCreditorRegistry(state, (cur) => ({
    ...cur,
    creditors: cur.creditors.map((c) =>
      c.id === creditorId ? { ...c, loans: c.loans.filter((l) => l.id !== loanId) } : c,
    ),
  }))
  return { next: reconcileCreditorRegistryChecklist(next, 'loan_removed') }
}

export function mergeCreditorRegistryPrefsIntoState(
  state: CreditorRegistryState | undefined,
  patch: Partial<CreditorRegistryPrefs>,
): CreditorRegistryState {
  return mergeCreditorRegistryPrefs(normalizeCreditorRegistry(state), patch)
}

export function setChecklistOverrideInRegistry(
  state: CreditorRegistryState | undefined,
  stepId: CreditorRegistryChecklistStepId,
  done: boolean,
): CreditorRegistryState {
  return patchCreditorRegistry(state, (cur) => ({
    ...cur,
    checklistOverrides: {
      ...(cur.checklistOverrides ?? {}),
      [stepId]: done,
    },
  }))
}

export type CreditorRegistryStoreError = Exclude<CreditorRegistryActionResult, { ok: true }>['reason']

export function toActionResult(
  error: CreditorRegistryStoreError | undefined,
  id?: string,
): CreditorRegistryActionResult {
  if (error) return { ok: false, reason: error }
  return id !== undefined ? { ok: true, id } : { ok: true }
}
