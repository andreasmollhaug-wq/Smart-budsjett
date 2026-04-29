import { SPARING_SORT_MODES, type SparingSortMode } from '@/lib/sparingGoalsSort'

/** Persistert målvalg for KPI på `/sparing`; ikke-bruk Set i JSON. */
export type GoalSelectionPersisted = 'all' | string[]

export interface SparingPagePrefs {
  goalSortMode: SparingSortMode
  showCompletedGoals: boolean
  goalSelection: GoalSelectionPersisted
}

const SORT_WHITELIST = new Set<string>(SPARING_SORT_MODES)

export const DEFAULT_SPARING_PAGE_PREFS: SparingPagePrefs = {
  goalSortMode: 'name_asc',
  showCompletedGoals: true,
  goalSelection: 'all',
}

/** Sikrer lagret prefs fra Supabase / migrering er konsistent med gjeldende moduser. */
export function normalizeSparingPagePrefs(raw: unknown): SparingPagePrefs {
  const d =
    raw !== null && typeof raw === 'object' ? (raw as Partial<Record<string, unknown>>) : {}

  let goalSortMode = DEFAULT_SPARING_PAGE_PREFS.goalSortMode
  const gsm = d.goalSortMode
  if (typeof gsm === 'string' && SORT_WHITELIST.has(gsm)) {
    goalSortMode = gsm as SparingSortMode
  }

  let showCompletedGoals = DEFAULT_SPARING_PAGE_PREFS.showCompletedGoals
  if (typeof d.showCompletedGoals === 'boolean') {
    showCompletedGoals = d.showCompletedGoals
  }

  let goalSelection: GoalSelectionPersisted = 'all'
  const gs = d.goalSelection
  if (gs === 'all') {
    goalSelection = 'all'
  } else if (Array.isArray(gs)) {
    const ids = gs.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    goalSelection = ids.length === 0 ? 'all' : ids
  }

  return { goalSortMode, showCompletedGoals, goalSelection }
}

/** Slår sammen eksisterende (evt. undefined) prefs med patch og normaliserer. */
export function mergePatchIntoSparingPagePrefs(
  existing: SparingPagePrefs | undefined,
  patch: Partial<SparingPagePrefs>,
): SparingPagePrefs {
  return normalizeSparingPagePrefs({
    ...(existing !== undefined ? existing : {}),
    ...patch,
  })
}

/** Neste persistert målvalg når bruker krysser av/på ett mål i KPI-utvalget (samme logikk som tidligere lokale Set-state). */
export function computeNextGoalSelectionForToggle(
  prev: GoalSelectionPersisted,
  goalId: string,
  visibleIds: string[],
): GoalSelectionPersisted {
  if (visibleIds.length === 0) return 'all'
  const prevSet = prev === 'all' ? 'all' : new Set(prev)

  if (prevSet === 'all') {
    const next = new Set(visibleIds.filter((id) => id !== goalId))
    if (next.size === 0 || next.size === visibleIds.length) return 'all'
    return [...next]
  }

  const next = new Set(prevSet)
  if (next.has(goalId)) next.delete(goalId)
  else next.add(goalId)
  if (next.size === 0) return 'all'
  if (next.size === visibleIds.length && visibleIds.every((id) => next.has(id))) return 'all'
  return [...next]
}
