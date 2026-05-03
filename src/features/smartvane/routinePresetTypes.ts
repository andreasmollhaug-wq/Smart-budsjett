import type { SmartvaneHabitKind } from './types'

export type RoutineCategoryId = 'hjem' | 'trening' | 'okonomi_hus' | 'personlig' | 'digital' | 'sosial'

export type RoutineCategory = {
  id: RoutineCategoryId
  titleNo: string
  descriptionNo?: string
  sortOrder: number
}

/**
 * Redaksjon: «ukentlig» for vedlikehold som typisk 1×/uke, «månedlig» for større sjeldne jobber,
 * «daglig» for små gjentakelser hver dag.
 */
export type RoutinePreset = {
  id: string
  categoryId: RoutineCategoryId
  name: string
  kind: SmartvaneHabitKind
  note?: string
  /** Kun for kind === 'daily' */
  targetDays?: number
  /** Små bokstaver, nøkkelord for søk (synonymer, stavevarianter) */
  tags?: string[]
}
