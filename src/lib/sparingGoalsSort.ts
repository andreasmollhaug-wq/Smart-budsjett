import type { SavingsGoal } from '@/lib/store'

export type SparingSortMode =
  | 'name_asc'
  | 'name_desc'
  | 'saved_asc'
  | 'saved_desc'
  | 'targetAmount_asc'
  | 'targetAmount_desc'
  | 'progress_asc'
  | 'progress_desc'
  | 'targetDate_asc'
  | 'targetDate_desc'

export const SPARING_SORT_MODES: SparingSortMode[] = [
  'name_asc',
  'name_desc',
  'saved_asc',
  'saved_desc',
  'targetAmount_asc',
  'targetAmount_desc',
  'progress_asc',
  'progress_desc',
  'targetDate_asc',
  'targetDate_desc',
]

export const SPARING_SORT_LABELS: Record<SparingSortMode, string> = {
  name_asc: 'Navn (A–Å)',
  name_desc: 'Navn (Å–A)',
  saved_asc: 'Spart beløp (minst først)',
  saved_desc: 'Spart beløp (størst først)',
  targetAmount_asc: 'Målbeløp (minst først)',
  targetAmount_desc: 'Målbeløp (høyest først)',
  progress_asc: 'Fullført (minst % først)',
  progress_desc: 'Fullført (mest % først)',
  targetDate_asc: 'Måldato (nærmest først)',
  targetDate_desc: 'Måldato (lengst unna først)',
}

export type SparingGoalSortRow = {
  goal: SavingsGoal
  effective: number
  progress: number
}

function cmpName(a: string, b: string): number {
  return a.localeCompare(b, 'nb-NO', { sensitivity: 'base' })
}

function tieNameThenId(ga: SavingsGoal, gb: SavingsGoal): number {
  const c = cmpName(ga.name, gb.name)
  return c !== 0 ? c : ga.id.localeCompare(gb.id)
}

/** Millisekunder siden epoch, eller null uten/ugyldig måldato. */
export function parseGoalTargetDateMs(goal: SavingsGoal): number | null {
  const raw = goal.targetDate?.trim()
  if (!raw) return null
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : null
}

/**
 * Sorter sparemål etter forhåndsberegnet effektiv sum og fremdrift (samme som i målkortene).
 */
export function sortSavingsGoalsForDisplay(rows: SparingGoalSortRow[], mode: SparingSortMode): SavingsGoal[] {
  return rows
    .slice()
    .sort((ra, rb) => {
      const ga = ra.goal
      const gb = rb.goal
      switch (mode) {
        case 'name_asc': {
          const c = cmpName(ga.name, gb.name)
          return c !== 0 ? c : ga.id.localeCompare(gb.id)
        }
        case 'name_desc': {
          const c = cmpName(ga.name, gb.name)
          return c !== 0 ? -c : ga.id.localeCompare(gb.id)
        }
        case 'saved_asc': {
          if (ra.effective !== rb.effective) return ra.effective - rb.effective
          if (ra.progress !== rb.progress) return rb.progress - ra.progress
          return tieNameThenId(ga, gb)
        }
        case 'saved_desc': {
          if (ra.effective !== rb.effective) return rb.effective - ra.effective
          if (ra.progress !== rb.progress) return rb.progress - ra.progress
          return tieNameThenId(ga, gb)
        }
        case 'targetAmount_asc': {
          const ta = ga.targetAmount
          const tb = gb.targetAmount
          if (ta !== tb) return ta - tb
          return tieNameThenId(ga, gb)
        }
        case 'targetAmount_desc': {
          const ta = ga.targetAmount
          const tb = gb.targetAmount
          if (ta !== tb) return tb - ta
          return tieNameThenId(ga, gb)
        }
        case 'progress_asc': {
          if (ra.progress !== rb.progress) return ra.progress - rb.progress
          if (ra.effective !== rb.effective) return rb.effective - ra.effective
          return tieNameThenId(ga, gb)
        }
        case 'progress_desc': {
          if (ra.progress !== rb.progress) return rb.progress - ra.progress
          if (ra.effective !== rb.effective) return rb.effective - ra.effective
          return tieNameThenId(ga, gb)
        }
        case 'targetDate_asc': {
          const ta = parseGoalTargetDateMs(ga)
          const tb = parseGoalTargetDateMs(gb)
          const aOrd = ta === null ? Number.POSITIVE_INFINITY : ta
          const bOrd = tb === null ? Number.POSITIVE_INFINITY : tb
          if (aOrd !== bOrd) return aOrd - bOrd
          return tieNameThenId(ga, gb)
        }
        case 'targetDate_desc': {
          const ta = parseGoalTargetDateMs(ga)
          const tb = parseGoalTargetDateMs(gb)
          if (ta === null && tb === null) return tieNameThenId(ga, gb)
          if (ta === null) return 1
          if (tb === null) return -1
          if (ta !== tb) return tb - ta
          return tieNameThenId(ga, gb)
        }
        default: {
          const _exhaustive: never = mode
          return _exhaustive
        }
      }
    })
    .map((r) => r.goal)
}
