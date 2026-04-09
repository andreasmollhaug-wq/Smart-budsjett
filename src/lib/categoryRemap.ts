import {
  DEFAULT_STANDARD_LABELS,
  isStandardLabel,
  type ParentCategory,
} from '@/lib/budgetCategoryCatalog'
import { cloneBudgetCategories } from '@/lib/budgetYearHelpers'
import type { ArchivedBudgetsByYear, BudgetCategory, PersonData, SavingsGoal, ServiceSubscription } from '@/lib/store'

export type CategoryRemapErrorReason =
  | 'same_name'
  | 'empty_name'
  | 'from_unused'
  | 'to_name_used_other_group'
  | 'merge_conflict_two_goals'

export type CategoryRemapResult =
  | { ok: true; person: PersonData; archivedBudgetsByYear: ArchivedBudgetsByYear }
  | { ok: false; reason: CategoryRemapErrorReason }

export function transactionTypeForParent(parent: ParentCategory): 'income' | 'expense' {
  return parent === 'inntekter' ? 'income' : 'expense'
}

function sumMonthlyArrays(a: number[], b: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
}

function hasNameInOtherParent(categories: BudgetCategory[], name: string, parent: ParentCategory): boolean {
  return categories.some((c) => c.name === name && c.parentCategory !== parent)
}

function remapTransactions(
  transactions: PersonData['transactions'],
  from: string,
  to: string,
  txType: 'income' | 'expense',
): PersonData['transactions'] {
  return transactions.map((t) => {
    if (t.category !== from || t.type !== txType) return t
    return { ...t, category: to }
  })
}

function updateCustomLabels(
  customBudgetLabels: PersonData['customBudgetLabels'],
  parent: ParentCategory,
  from: string,
  to: string,
): PersonData['customBudgetLabels'] {
  const cur = [...(customBudgetLabels[parent] ?? [])].filter((x) => x !== from)
  const toIsStandard = isStandardLabel(parent, to)
  if (!toIsStandard && to.trim() && !cur.includes(to)) {
    cur.push(to)
  }
  return { ...customBudgetLabels, [parent]: cur }
}

function unhideIfStandard(
  hiddenBudgetLabels: PersonData['hiddenBudgetLabels'],
  parent: ParentCategory,
  to: string,
): PersonData['hiddenBudgetLabels'] {
  if (!isStandardLabel(parent, to)) return hiddenBudgetLabels
  const hid = [...(hiddenBudgetLabels[parent] ?? [])].filter((x) => x !== to)
  return { ...hiddenBudgetLabels, [parent]: hid }
}

function relinkSubscriptions(subs: ServiceSubscription[], fromId: string, toId: string): ServiceSubscription[] {
  return subs.map((s) =>
    s.linkedBudgetCategoryId === fromId ? { ...s, linkedBudgetCategoryId: toId } : s,
  )
}

function relinkSavingsGoals(
  goals: SavingsGoal[],
  fromId: string,
  toId: string,
): { goals: SavingsGoal[]; conflict: boolean } {
  const fromGoal = goals.find((g) => g.linkedBudgetCategoryId === fromId)
  const toGoal = goals.find((g) => g.linkedBudgetCategoryId === toId)
  if (fromGoal && toGoal) {
    return { goals, conflict: true }
  }
  const next = goals.map((g) =>
    g.linkedBudgetCategoryId === fromId ? { ...g, linkedBudgetCategoryId: toId } : g,
  )
  return { goals: next, conflict: false }
}

/**
 * Slår sammen eller omdøper budsjettlinjer for én liste (gjeldende budsjett eller arkiv-snapshot).
 */
function remapBudgetCategoryList(
  list: BudgetCategory[],
  parent: ParentCategory,
  fromName: string,
  toName: string,
): { list: BudgetCategory[]; mergedFromId?: string; mergedToId?: string } {
  const fromCat = list.find((c) => c.parentCategory === parent && c.name === fromName)
  const toCat = list.find((c) => c.parentCategory === parent && c.name === toName)

  if (!fromCat && !toCat) {
    return { list }
  }

  if (fromCat && !toCat) {
    const next = list.map((c) => (c.id === fromCat.id ? { ...c, name: toName } : c))
    return { list: next }
  }

  if (!fromCat && toCat) {
    return { list }
  }

  if (fromCat && toCat) {
    if (fromCat.id === toCat.id) {
      return { list }
    }

    const mergedBudgeted = sumMonthlyArrays(
      Array.from({ length: 12 }, (_, i) => fromCat.budgeted[i] ?? 0),
      Array.from({ length: 12 }, (_, i) => toCat.budgeted[i] ?? 0),
    )

    const nextList = list
      .filter((c) => c.id !== fromCat.id)
      .map((c) => (c.id === toCat.id ? { ...c, budgeted: mergedBudgeted } : c))

    return { list: nextList, mergedFromId: fromCat.id, mergedToId: toCat.id }
  }

  return { list }
}

function applyRemapOnCategoryListWithLinks(
  list: BudgetCategory[],
  parent: ParentCategory,
  fromName: string,
  toName: string,
  goals: SavingsGoal[],
  subs: ServiceSubscription[],
): {
  list: BudgetCategory[]
  goals: SavingsGoal[]
  subs: ServiceSubscription[]
  error?: 'merge_conflict_two_goals'
} {
  const fromCat = list.find((c) => c.parentCategory === parent && c.name === fromName)
  const toCat = list.find((c) => c.parentCategory === parent && c.name === toName)

  if (fromCat && toCat && fromCat.id !== toCat.id) {
    const { goals: g2, conflict } = relinkSavingsGoals(goals, fromCat.id, toCat.id)
    if (conflict) {
      return { list, goals, subs, error: 'merge_conflict_two_goals' }
    }
    const subs2 = relinkSubscriptions(subs, fromCat.id, toCat.id)
    const { list: list2 } = remapBudgetCategoryList(list, parent, fromName, toName)
    return { list: list2, goals: g2, subs: subs2 }
  }

  const { list: list2 } = remapBudgetCategoryList(list, parent, fromName, toName)
  return { list: list2, goals, subs }
}

function remapArchivedBudgets(
  archived: ArchivedBudgetsByYear,
  profileId: string,
  parent: ParentCategory,
  fromName: string,
  toName: string,
): ArchivedBudgetsByYear {
  const out: ArchivedBudgetsByYear = { ...archived }
  for (const year of Object.keys(archived)) {
    const byProfile = archived[year]
    if (!byProfile) continue
    const cats = byProfile[profileId]
    if (!cats?.length) continue
    const { list } = remapBudgetCategoryList(cloneBudgetCategories(cats), parent, fromName, toName)
    out[year] = {
      ...byProfile,
      [profileId]: list,
    }
  }
  return out
}

/**
 * Full kategori-remap for én profil: transaksjoner, budsjett, etiketter, skjulte standarder,
 * sparemål/abonnement (ved sammenslåing), og arkiverte budsjett per år.
 */
export function applyCategoryRemap(
  person: PersonData,
  archivedBudgetsByYear: ArchivedBudgetsByYear,
  profileId: string,
  parent: ParentCategory,
  fromNameRaw: string,
  toNameRaw: string,
): CategoryRemapResult {
  const from = fromNameRaw.trim()
  const to = toNameRaw.trim()
  if (!from || !to) {
    return { ok: false, reason: 'empty_name' }
  }
  if (from === to) {
    return { ok: false, reason: 'same_name' }
  }

  if (hasNameInOtherParent(person.budgetCategories, to, parent)) {
    return { ok: false, reason: 'to_name_used_other_group' }
  }

  const txType = transactionTypeForParent(parent)
  const hasTx = person.transactions.some((t) => t.category === from && t.type === txType)
  const inCustom = (person.customBudgetLabels[parent] ?? []).includes(from)
  const hasBudgetRow = person.budgetCategories.some((c) => c.parentCategory === parent && c.name === from)
  if (!hasTx && !inCustom && !hasBudgetRow) {
    return { ok: false, reason: 'from_unused' }
  }

  const transactions = remapTransactions(person.transactions, from, to, txType)
  let budgetCategories = person.budgetCategories
  let savingsGoals = person.savingsGoals
  let serviceSubscriptions = person.serviceSubscriptions ?? []

  const merged = applyRemapOnCategoryListWithLinks(
    budgetCategories,
    parent,
    from,
    to,
    savingsGoals,
    serviceSubscriptions,
  )
  if (merged.error) {
    return { ok: false, reason: 'merge_conflict_two_goals' }
  }
  budgetCategories = merged.list
  savingsGoals = merged.goals
  serviceSubscriptions = merged.subs

  let customBudgetLabels = updateCustomLabels(person.customBudgetLabels, parent, from, to)
  const hiddenBudgetLabels = unhideIfStandard(person.hiddenBudgetLabels, parent, to)

  if (isStandardLabel(parent, to)) {
    const cur = [...(customBudgetLabels[parent] ?? [])].filter((x) => x !== to)
    customBudgetLabels = { ...customBudgetLabels, [parent]: cur }
  }

  const archived = remapArchivedBudgets(archivedBudgetsByYear, profileId, parent, from, to)

  const nextPerson: PersonData = {
    ...person,
    transactions,
    budgetCategories,
    savingsGoals,
    serviceSubscriptions,
    customBudgetLabels,
    hiddenBudgetLabels,
  }

  return { ok: true, person: nextPerson, archivedBudgetsByYear: archived }
}

/** Alle navn som kan velges som mål innenfor én hovedgruppe (alle standardforslag — også skjulte — pluss egne og budsjettlinjer). */
export function collectLabelUniverseForParent(
  parent: ParentCategory,
  customBudgetLabels: PersonData['customBudgetLabels'],
  budgetCategories: BudgetCategory[],
): string[] {
  const standard = DEFAULT_STANDARD_LABELS[parent]
  const custom = customBudgetLabels[parent] ?? []
  const names = new Set<string>([...standard, ...custom])
  for (const c of budgetCategories) {
    if (c.parentCategory === parent) names.add(c.name)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'nb'))
}
