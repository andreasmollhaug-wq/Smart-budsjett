import type { BudgetCategoryFrequency } from '@/lib/utils'
import { budgetedMonthsFromFrequency } from '@/lib/utils'

/** Samme kopi av metadata på hver deltakerrad i husholdning. */
export type HouseholdSplitMode = 'equal' | 'percent' | 'amount'

export type HouseholdSplitMeta = {
  groupId: string
  mode: HouseholdSplitMode
  /** Minst to profiler, rekkefølge = indeks for prosent- og andels-array. */
  participantProfileIds: string[]
  /** Når `mode === 'percent'`: samme lengde, sum 100. */
  percentWeights?: number[]
  /**
   * Når `mode === 'amount'`: referansebeløp per deltaker (typisk trukket fra samme måneds inndata),
   * brukt til faste andeler for alle måneder.
   */
  amountReferenceByProfileId?: Record<string, number>
}

const EPS = 1e-6

/**
 * Toleranse når andelsbeløp (kroner) skal matche hovedlinjens beløp (samme enhet som bruker skriver i skjemaet).
 */
export const AMOUNT_REF_LINE_MATCH_EPS_NOK = 0.5

export type ValidateHouseholdSplitMetaOptions = {
  lineAmountNok?: number
}

function formatKrForSplitMessage(n: number): string {
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-6) {
    return String(Math.round(n))
  }
  return n.toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * Sjekker at summen av `amountReferenceByProfileId` for deltakerne tilsvarer `lineAmountNok`
 * (brukes ved ny felleslinje; lagrede linjer valideres uten dette i `validateHouseholdSplitMeta`).
 */
export function amountReferencesSumMatchesLine(
  participantProfileIds: string[],
  amountReferenceByProfileId: Record<string, number>,
  lineAmountNok: number,
): { ok: true } | { ok: false; message: string } {
  const s = sumArray(participantProfileIds.map((id) => amountReferenceByProfileId[id] ?? 0))
  if (Math.abs(s - lineAmountNok) <= AMOUNT_REF_LINE_MATCH_EPS_NOK) {
    return { ok: true }
  }
  return {
    ok: false,
    message: `Andelsbeløpene summerer til ${formatKrForSplitMessage(s)} kr, men beløpet over er ${formatKrForSplitMessage(lineAmountNok)} kr. Juster delbeløpene så de summerer likt.`,
  }
}

export function roundNok(n: number): number {
  return Math.round(n)
}

function sumArray(a: number[]): number {
  return a.reduce((s, x) => s + x, 0)
}

export function validateHouseholdSplitMeta(
  meta: HouseholdSplitMeta,
  options?: ValidateHouseholdSplitMetaOptions,
): { ok: true } | { ok: false; message: string } {
  if (!meta.groupId) return { ok: false, message: 'Mangler gruppe.' }
  const ids = meta.participantProfileIds
  if (ids.length < 2) return { ok: false, message: 'Minst to deltakere.' }
  const uniq = new Set(ids)
  if (uniq.size !== ids.length) return { ok: false, message: 'Duplikat profil.' }
  if (meta.mode === 'percent') {
    const w = meta.percentWeights
    if (!w || w.length !== ids.length) return { ok: false, message: 'Angi prosent for hver deltaker.' }
    const t = w.reduce((a, b) => a + b, 0)
    if (Math.abs(t - 100) > 0.01) return { ok: false, message: 'Prosent skal sum til 100.' }
  }
  if (meta.mode === 'amount') {
    const ref = meta.amountReferenceByProfileId
    if (!ref) return { ok: false, message: 'Mangler fordeling i kroner.' }
    let s = 0
    for (const id of ids) {
      const v = ref[id]
      if (v === undefined || !Number.isFinite(v) || v < 0) {
        return { ok: false, message: 'Ugyldig beløp for en deltaker.' }
      }
      s += v
    }
    if (s <= 0) return { ok: false, message: 'Beløp må være større enn 0 totalt.' }
    if (options?.lineAmountNok !== undefined) {
      const m = amountReferencesSumMatchesLine(ids, ref, options.lineAmountNok)
      if (!m.ok) return m
    }
  }
  return { ok: true }
}

function equalSplitNok(total: number, n: number): number[] {
  if (n <= 0) return []
  const t = roundNok(total)
  const base = Math.floor(t / n)
  const rem = t - base * n
  const o: number[] = Array(n).fill(base)
  for (let k = 0; k < rem; k++) o[k]! += 1
  return o
}

function percentSplitNok(total: number, weights: number[]): number[] {
  if (weights.length === 0) return []
  const t = roundNok(total)
  const parts = weights.map((w) => (t * w) / 100)
  const floored = parts.map((x) => Math.floor(x))
  const s = floored.reduce((a, b) => a + b, 0)
  const remainder = t - s
  const order = parts
    .map((x, i) => ({ i, frac: x - floored[i]! }))
    .sort((a, b) => b.frac - a.frac)
  for (let k = 0; k < remainder; k++) {
    const idx = order[k % order.length]!.i
    floored[idx]! += 1
  }
  return floored
}

function amountRatioSplitNok(
  t: number,
  ids: string[],
  amountReferenceByProfileId: Record<string, number>,
): { ok: true; parts: number[] } | { ok: false; message: string } {
  const refSum = sumArray(ids.map((id) => amountReferenceByProfileId[id] ?? 0))
  if (refSum <= 0) return { ok: false, message: 'Ugyldig fordeling i kroner.' }
  const tt = roundNok(t)
  const raw = ids.map((id) => ((amountReferenceByProfileId[id] ?? 0) / refSum) * tt)
  const floored = raw.map((x) => Math.floor(x))
  const s = floored.reduce((a, b) => a + b, 0)
  const rem = tt - s
  const order = raw
    .map((x, i) => ({ i, frac: x - floored[i]! }))
    .sort((a, b) => b.frac - a.frac)
  for (let k = 0; k < rem; k++) {
    const idx = order[k % order.length]!.i
    floored[idx]! += 1
  }
  return { ok: true, parts: floored }
}

export function splitOneMonthTotal(
  t: number,
  meta: HouseholdSplitMeta,
): { ok: true; parts: number[] } | { ok: false; message: string } {
  const v = validateHouseholdSplitMeta(meta)
  if (!v.ok) return v
  const ids = meta.participantProfileIds
  if (t < 0) return { ok: false, message: 'Negativt beløp er ikke støttet for felles linje.' }
  if (t === 0) return { ok: true, parts: ids.map(() => 0) }
  if (meta.mode === 'equal') {
    return { ok: true, parts: equalSplitNok(t, ids.length) }
  }
  if (meta.mode === 'percent' && meta.percentWeights) {
    if (meta.percentWeights.length !== ids.length) {
      return { ok: false, message: 'Prosent må samsvare med antall deltakere.' }
    }
    return { ok: true, parts: percentSplitNok(t, meta.percentWeights) }
  }
  if (meta.mode === 'amount' && meta.amountReferenceByProfileId) {
    return amountRatioSplitNok(t, ids, meta.amountReferenceByProfileId)
  }
  return { ok: false, message: 'Ugyldig fordelingsmodus.' }
}

/**
 * For 12-måneders totallinje, beregn hver deltakers `number[]` slik at summen per måned
 * tilsvarer `total` (heltall i husholdning vises som avrundet).
 */
export function splitTotalBudgetBetweenParticipants(
  total: number[],
  meta: HouseholdSplitMeta,
): { ok: true; byProfileId: Record<string, number[]> } | { ok: false; message: string } {
  if (total.length !== 12) return { ok: false, message: 'Forvent 12 måneder.' }
  const v0 = validateHouseholdSplitMeta(meta)
  if (!v0.ok) return v0
  const ids = meta.participantProfileIds
  const byProfileId: Record<string, number[]> = {}
  for (const id of ids) {
    byProfileId[id] = Array(12).fill(0)
  }
  for (let m = 0; m < 12; m++) {
    const r = splitOneMonthTotal(total[m] ?? 0, meta)
    if (!r.ok) return r
    for (let i = 0; i < ids.length; i++) {
      byProfileId[ids[i]!]![m]! = r.parts[i]!
    }
  }
  return { ok: true, byProfileId }
}

export function buildTotalFromAmountInput(
  amount: number,
  frequency: BudgetCategoryFrequency,
  onceMonthIndex?: number,
): number[] {
  return budgetedMonthsFromFrequency(amount, frequency, onceMonthIndex)
}

/**
 * Når bruker endrer sitt andelsbeløp for én måned: ny husholdningstotal tilsier vekter uendret.
 * `newPart` er delbeløp for `editedProfileId` (én måned, avrundet for visning som heltall).
 */
export function impliedNewMonthTotal(
  mode: HouseholdSplitMode,
  participantProfileIds: string[],
  editedProfileId: string,
  newPart: number,
  percentWeights: number[] | undefined,
  amountReferenceByProfileId: Record<string, number> | undefined,
): number | null {
  const idx = participantProfileIds.indexOf(editedProfileId)
  if (idx < 0) return null
  if (mode === 'equal') {
    const n = participantProfileIds.length
    if (n === 0) return null
    return roundNok(newPart * n)
  }
  if (mode === 'percent' && percentWeights) {
    const w = percentWeights[idx] ?? 0
    if (w < EPS) return null
    return roundNok((newPart * 100) / w)
  }
  if (mode === 'amount' && amountReferenceByProfileId) {
    const refSum = sumArray(participantProfileIds.map((id) => amountReferenceByProfileId[id] ?? 0))
    const refI = amountReferenceByProfileId[editedProfileId] ?? 0
    if (refI < EPS || refSum < EPS) return null
    return roundNok((newPart * refSum) / refI)
  }
  return null
}

/** I aggregat: for samme `groupId` er metadata likt; ved mismatch behold første. */
export function pickHouseholdSplitForAggregate(
  a: HouseholdSplitMeta | undefined,
  b: HouseholdSplitMeta | undefined,
): HouseholdSplitMeta | undefined {
  if (a && b && a.groupId === b.groupId) return a
  return a ?? b
}
