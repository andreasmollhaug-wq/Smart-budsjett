import type { CategoryRemapErrorReason } from '@/lib/categoryRemap'
import type { BudgetCategory } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'

const REMAP_ERROR_NB: Record<CategoryRemapErrorReason, string> = {
  same_name: 'Nytt navn må være forskjellig fra det gamle.',
  empty_name: 'Skriv inn et navn.',
  from_unused: 'Kategorien finnes ikke lenger.',
  to_name_used_other_group: 'Dette navnet brukes allerede i en annen hovedgruppe.',
  merge_conflict_two_goals:
    'Begge kategoriene har et koblet sparemål. Frakoble eller flytt ett sparemål under Sparing før du slår sammen.',
}

export function remapErrorNb(reason: CategoryRemapErrorReason): string {
  return REMAP_ERROR_NB[reason]
}

/**
 * Når omdøping til `toName` vil slå sammen to linjer (samme hovedgruppe, annen rad har allerede dette navnet).
 */
export function willMergeWithExistingLineInParent(
  categories: BudgetCategory[],
  parent: ParentCategory,
  currentId: string,
  toNameTrimmed: string,
): boolean {
  if (!toNameTrimmed) return false
  return categories.some(
    (c) => c.parentCategory === parent && c.name === toNameTrimmed && c.id !== currentId,
  )
}
