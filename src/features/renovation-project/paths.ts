/** Kanonisk app-sti for oppussings-/prosjektmodulen (redirect fra /intern/prosjekt i next.config). */
export const RENOVATION_PROJECT_BASE_PATH = '/prosjekt' as const

/** localStorage: når satt, skjul forventningsboks på prosjektlisten. */
export const RENOVATION_SCOPE_INFO_DISMISSED_STORAGE_KEY = 'sb_renovation_scope_info_v1' as const

/**
 * Åpen/lukket panel for budsjettlinjer på prosjektdetalj.
 * `localStorage`-verdi: `'1'` = åpen, `'0'` = lukket. Mangler nøkkel → første besøk = åpent.
 */
export function renovationDetailBudgetLinesStorageKey(projectId: string): string {
  return `sb_renovation_detail_budget_lines_v1:${projectId}`
}

/**
 * Åpen/lukket panel for sjekkliste på prosjektdetalj.
 * `localStorage`: `'1'` = åpen, `'0'` = lukket. Mangler nøkkel → første besøk = åpent (som budsjettlinjer).
 */
export function renovationDetailChecklistStorageKey(projectId: string): string {
  return `sb_renovation_detail_checklist_v1:${projectId}`
}
