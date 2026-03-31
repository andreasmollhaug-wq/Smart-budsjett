import type { FormuebyggerInput } from './types'

export interface FormuebyggerPersistedState {
  input: FormuebyggerInput
  /** Ekstra innskudd per global måned (nøkkel som string for JSON) */
  extraByMonth: Record<string, number>
}

export function createDefaultFormuebyggerPersistedState(): FormuebyggerPersistedState {
  return {
    input: {
      startAmount: 100_000,
      annualReturn: 0.07,
      savingsPerPayment: 1_000,
      savingsFrequency: 12,
      years: 20,
      taxRate: 0.22,
      inflation: 0.025,
      compoundFrequency: 12,
    },
    extraByMonth: {},
  }
}

export function normalizeFormuebyggerPersistedState(raw: unknown): FormuebyggerPersistedState {
  const d = createDefaultFormuebyggerPersistedState()
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Partial<FormuebyggerPersistedState>
  const inp = r.input && typeof r.input === 'object' ? (r.input as Partial<FormuebyggerInput>) : {}
  const extra =
    r.extraByMonth && typeof r.extraByMonth === 'object'
      ? (r.extraByMonth as Record<string, number>)
      : {}
  return {
    input: { ...d.input, ...inp },
    extraByMonth: { ...extra },
  }
}

/** Konverter sparse Record til tett array for simulering */
export function extraRecordToArray(totalMonths: number, extra: Record<string, number>): number[] {
  const arr = Array.from({ length: totalMonths }, () => 0)
  for (const [k, v] of Object.entries(extra)) {
    const i = Number(k)
    if (Number.isInteger(i) && i >= 0 && i < totalMonths && typeof v === 'number' && Number.isFinite(v)) {
      arr[i] = Math.max(0, v)
    }
  }
  return arr
}
