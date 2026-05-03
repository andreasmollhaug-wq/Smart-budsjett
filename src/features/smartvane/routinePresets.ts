import type { RoutineCategory, RoutineCategoryId, RoutinePreset } from './routinePresetTypes'
import { ROUTINE_CATEGORIES, ROUTINE_PRESETS } from './routinePresetsCatalog'

/** Forsøkningsvis normalisering for søk (æøå, aksentstripping der det passer) */
export function normalizeNoSearch(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

const presetById = new Map<string, RoutinePreset>()
for (const p of ROUTINE_PRESETS) {
  presetById.set(p.id, p)
}

export function getRoutinePresetById(id: string): RoutinePreset | undefined {
  return presetById.get(id)
}

/** Sorterte kategorier fra katalog */
export function getCategoryList(): RoutineCategory[] {
  return [...ROUTINE_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Alle presets i én kategori */
export function getPresetsByCategory(categoryId: RoutineCategoryId): RoutinePreset[] {
  return ROUTINE_PRESETS.filter((p) => p.categoryId === categoryId)
}

/** Filt på fritekst (navn, tags, note) og valgfritt kategori */
export function searchPresets(query: string, categoryId?: RoutineCategoryId | null): RoutinePreset[] {
  const q = normalizeNoSearch(query)
  const list =
    categoryId == null ? [...ROUTINE_PRESETS] : ROUTINE_PRESETS.filter((p) => p.categoryId === categoryId)

  if (!q) return list

  return list.filter((p) => {
    const hay = [
      normalizeNoSearch(p.name),
      p.note ? normalizeNoSearch(p.note) : '',
      ...(p.tags ?? []).map(normalizeNoSearch),
    ].join(' ')
    const tokens = q.split(/\s+/).filter(Boolean)
    return tokens.every((t) => hay.includes(t))
  })
}

export const ROUTINE_PRESET_BATCH_MAX = 10

export type { RoutineCategory, RoutineCategoryId, RoutinePreset } from './routinePresetTypes'
export { ROUTINE_CATEGORIES, ROUTINE_PRESETS } from './routinePresetsCatalog'
