import { emptyLabelLists, type LabelLists, type ParentCategory } from '@/lib/budgetCategoryCatalog'
import {
  mergeBudgetCategoriesFromSnapshots,
  type ArchivedBudgetsByYear,
  type BudgetCategory,
  type PersonData,
  type PersonProfile,
} from '@/lib/store'

export type ResolveBudgetCategoriesCtx = {
  people: Record<string, PersonData>
  profiles: PersonProfile[]
  budgetYear: number
  exportYear: number
  archivedBudgetsByYear: ArchivedBudgetsByYear
}

function profileIds(profiles: PersonProfile[]): string[] {
  return profiles.map((p) => p.id)
}

function liveCategoriesByProfile(people: Record<string, PersonData>, profileIdsList: string[]): Record<string, BudgetCategory[]> {
  const snap: Record<string, BudgetCategory[]> = {}
  for (const pid of profileIdsList) {
    snap[pid] = people[pid]?.budgetCategories ?? []
  }
  return snap
}

export function resolveBudgetCategoriesForScope(
  scopeKey: 'household' | string,
  ctx: ResolveBudgetCategoriesCtx,
): BudgetCategory[] {
  const ids = profileIds(ctx.profiles)
  const yearKey = String(ctx.exportYear)

  if (scopeKey === 'household') {
    if (ctx.exportYear === ctx.budgetYear) {
      return mergeBudgetCategoriesFromSnapshots(liveCategoriesByProfile(ctx.people, ids), ids)
    }
    const snap = ctx.archivedBudgetsByYear[yearKey]
    if (!snap) return []
    return mergeBudgetCategoriesFromSnapshots(snap, ids)
  }

  if (ctx.exportYear === ctx.budgetYear) {
    return ctx.people[scopeKey]?.budgetCategories ?? []
  }
  return ctx.archivedBudgetsByYear[yearKey]?.[scopeKey] ?? []
}

function mergeLabelListsForHousehold(
  people: Record<string, PersonData>,
  profileIdsList: string[],
): LabelLists {
  const customBudgetLabels = emptyLabelLists().customBudgetLabels
  const hiddenBudgetLabels = emptyLabelLists().hiddenBudgetLabels

  for (const parent of Object.keys(customBudgetLabels) as ParentCategory[]) {
    const customSet = new Set<string>(customBudgetLabels[parent])
    const hiddenSet = new Set<string>(hiddenBudgetLabels[parent])
    for (const pid of profileIdsList) {
      const p = people[pid]
      if (!p) continue
      for (const label of p.customBudgetLabels?.[parent] ?? []) customSet.add(label)
      for (const label of p.hiddenBudgetLabels?.[parent] ?? []) hiddenSet.add(label)
    }
    customBudgetLabels[parent] = [...customSet]
    hiddenBudgetLabels[parent] = [...hiddenSet]
  }

  return { customBudgetLabels, hiddenBudgetLabels }
}

export function resolveLabelListsForScope(
  scopeKey: 'household' | string,
  ctx: Pick<ResolveBudgetCategoriesCtx, 'people' | 'profiles'>,
): LabelLists {
  if (scopeKey === 'household') {
    return mergeLabelListsForHousehold(ctx.people, profileIds(ctx.profiles))
  }
  const p = ctx.people[scopeKey]
  return {
    customBudgetLabels: p?.customBudgetLabels ?? emptyLabelLists().customBudgetLabels,
    hiddenBudgetLabels: p?.hiddenBudgetLabels ?? emptyLabelLists().hiddenBudgetLabels,
  }
}
