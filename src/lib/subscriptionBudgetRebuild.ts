import type { PersonData, ServiceSubscription } from '@/lib/store'

/**
 * Om abonnementet skal telle med i budsjett for gitt kalenderår/måned (måned 0 = jan).
 * Avsluttede: måneder før `cancelledFrom` i samme år, og alle måneder i tidligere år når avslutning er i fremtiden år.
 */
export function isSubscriptionContributingInBudgetMonth(
  sub: ServiceSubscription,
  year: number,
  monthIndex0: number,
): boolean {
  const month1 = monthIndex0 + 1
  if (sub.cancelledFrom) {
    const cf = sub.cancelledFrom
    if (year > cf.year) return false
    if (year === cf.year && month1 >= cf.month) return false
    return true
  }
  return sub.active === true
}

export function clampYearlyChargeMonth1(m: number | undefined): number | undefined {
  if (m == null || !Number.isFinite(m)) return undefined
  const x = Math.floor(m)
  if (x < 1 || x > 12) return undefined
  return x
}

/**
 * Kostnad i valgt måned for oversikt/graf (uavhengig av synk til budsjett).
 * Samme fordelingsregler som budsjett, men uten krav om syncToBudget.
 */
export function subscriptionRollupContributionForMonth(
  sub: ServiceSubscription,
  year: number,
  monthIndex0: number,
): number {
  if (!isSubscriptionContributingInBudgetMonth(sub, year, monthIndex0)) return 0
  const a = Math.max(0, Number.isFinite(sub.amountNok) ? sub.amountNok : 0)
  if (sub.billing === 'monthly') return a
  const chargeM = clampYearlyChargeMonth1(sub.yearlyChargeMonth1)
  if (chargeM == null) return a / 12
  return monthIndex0 + 1 === chargeM ? a : 0
}

/**
 * Planbeløp (kr) som dette abonnementet bidrar med i budsjett for én måned.
 * Krever syncToBudget + linkedBudgetCategoryId; ellers 0.
 */
export function subscriptionBudgetContributionForMonth(
  sub: ServiceSubscription,
  year: number,
  monthIndex0: number,
): number {
  if (!sub.syncToBudget || !sub.linkedBudgetCategoryId) return 0
  return subscriptionRollupContributionForMonth(sub, year, monthIndex0)
}

/** Én budsjett-rad (12 måneder) fra alle abonnement som peker på samme Regninger-kategori. */
export function rebuildRegningerCategoryBudgetFromSubscriptions(
  person: PersonData,
  budgetYear: number,
  categoryId: string,
): number[] {
  const out = Array(12).fill(0) as number[]
  for (const sub of person.serviceSubscriptions ?? []) {
    if (!sub.syncToBudget || sub.linkedBudgetCategoryId !== categoryId) continue
    for (let m = 0; m < 12; m++) {
      out[m] += subscriptionBudgetContributionForMonth(sub, budgetYear, m)
    }
  }
  return out
}

/** Finn alle Regninger-kategori-ID-er som har minst ett synket abonnement. */
export function regningerCategoryIdsWithSyncedSubscriptions(person: PersonData): Set<string> {
  const ids = new Set<string>()
  for (const sub of person.serviceSubscriptions ?? []) {
    if (sub.syncToBudget && sub.linkedBudgetCategoryId) ids.add(sub.linkedBudgetCategoryId)
  }
  return ids
}

/**
 * Oppdaterer `budgeted` for alle Regninger-linjer som har synkede abonnement, ut fra abodata.
 * Skal kalles ved lasting/årsskifte og erstatter tidligere «null hele linjen ved avslutning» for delte kategorier.
 */
export function applySubscriptionBudgetRebuildsForYear(person: PersonData, year: number): PersonData {
  const ids = regningerCategoryIdsWithSyncedSubscriptions(person)
  return applySubscriptionBudgetRebuildsForCategoryIds(person, year, ids)
}

/** Oppdaterer kun angitte kategori-ID-er (f.eks. etter én endring i store). */
export function applySubscriptionBudgetRebuildsForCategoryIds(
  person: PersonData,
  year: number,
  categoryIds: Iterable<string>,
): PersonData {
  let budgetCategories = person.budgetCategories
  for (const id of categoryIds) {
    const exists = budgetCategories.some((c) => c.id === id)
    if (!exists) continue
    const budgeted = rebuildRegningerCategoryBudgetFromSubscriptions(person, year, id)
    budgetCategories = budgetCategories.map((c) => (c.id === id ? { ...c, budgeted } : c))
  }
  return { ...person, budgetCategories }
}
