import type { BudgetCategory } from '@/lib/store'
import type { HouseholdSplitMeta } from '@/lib/householdBudgetSplit'
import { impliedNewMonthTotal } from '@/lib/householdBudgetSplit'
import { budgetedMonthsFromFrequency } from '@/lib/utils'
import {
  effectiveBudgetedIncomeMonth,
  grossFromDesiredNet,
  withholdingPercentForBudgetCategory,
} from '@/lib/incomeWithholding'

function ensureArrayBudgeted(budgeted: unknown): number[] {
  if (Array.isArray(budgeted)) return budgeted
  return Array(12).fill(budgeted || 0)
}

/** Måned som brukes når engangslinje vises/redigeres (0–11). */
export function getOnceLineDisplayMonthIndex(cat: BudgetCategory): number {
  if (cat.frequency !== 'once') return 0
  if (cat.onceMonthIndex != null) {
    return Math.min(11, Math.max(0, cat.onceMonthIndex))
  }
  const arr = ensureArrayBudgeted(cat.budgeted)
  for (let i = 0; i < 12; i++) {
    if ((arr[i] ?? 0) > 0) return i
  }
  return 0
}

export type ApplyOnceMonthEffects = {
  updateBudgetCategory: (id: string, data: Partial<BudgetCategory>) => void
  resplitSharedHouseholdGroupFromTotals: (
    groupId: string,
    total: number[],
    meta: HouseholdSplitMeta,
  ) => { ok: true } | { ok: false; reason: string }
}

export type ApplyOnceMonthInput = {
  category: BudgetCategory
  newMonthIndex: number
  isHouseholdAggregate: boolean
  activeProfileId: string
  /** Samme som budsjett-ruten: inntekter + trekk aktivert for linjen. */
  useIncomeWithholding: boolean
}

export type ApplyOnceMonthResult =
  | { ok: true }
  | { ok: false; reason: 'not_once' | 'no_change' | 'implied_total_null' | 'resplit_failed' }

/**
 * Flytter en engangslinje til en annen måned uten å endre økonomisk innhold
 * (samme logikk som celle-endring i budsjett).
 */
export function applyOnceMonthIndexChange(
  input: ApplyOnceMonthInput,
  effects: ApplyOnceMonthEffects,
): ApplyOnceMonthResult {
  const { category: cat, isHouseholdAggregate, activeProfileId, useIncomeWithholding } = input
  if (cat.frequency !== 'once') {
    return { ok: false, reason: 'not_once' }
  }
  const newMonth = Math.min(11, Math.max(0, Math.floor(input.newMonthIndex)))
  const oldMonth = getOnceLineDisplayMonthIndex(cat)
  if (newMonth === oldMonth) {
    return { ok: false, reason: 'no_change' }
  }

  const m = cat.householdSplit
  if (m && !isHouseholdAggregate) {
    const arr = ensureArrayBudgeted(cat.budgeted)
    const part = arr[oldMonth] ?? 0
    const t = impliedNewMonthTotal(
      m.mode,
      m.participantProfileIds,
      activeProfileId,
      part,
      m.percentWeights,
      m.amountReferenceByProfileId,
    )
    if (t == null) {
      return { ok: false, reason: 'implied_total_null' }
    }
    const total = Array(12).fill(0)
    total[newMonth] = t
    const r = effects.resplitSharedHouseholdGroupFromTotals(m.groupId, total, m)
    if (!r.ok) {
      return { ok: false, reason: 'resplit_failed' }
    }
    return { ok: true }
  }

  let n: number
  if (useIncomeWithholding) {
    const net = effectiveBudgetedIncomeMonth(cat, oldMonth)
    const p = withholdingPercentForBudgetCategory(cat)
    n = grossFromDesiredNet(net, p)
  } else {
    n = ensureArrayBudgeted(cat.budgeted)[oldMonth] ?? 0
  }

  effects.updateBudgetCategory(cat.id, {
    budgeted: budgetedMonthsFromFrequency(n, 'once', newMonth),
    onceMonthIndex: newMonth,
  })
  return { ok: true }
}
