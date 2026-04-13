import type { PersonData, Transaction } from '@/lib/store'
import { dateInMonth, generateId } from '@/lib/utils'
import { monthlyEquivalentNok } from '@/lib/serviceSubscriptionHelpers'

/** Måned 1–12 → indeks 0–11 i budsjett-array. */
export function monthIndexFromOneBased(month: number): number {
  const m = Math.floor(month)
  if (m < 1 || m > 12) return 0
  return m - 1
}

/** Dag i måneden for planlagte trekk (1–31); korte måneder klippes ved dato-bygging. */
export function clampBillingDay(day: number): number {
  const d = Math.floor(day)
  if (!Number.isFinite(d)) return 1
  return Math.min(31, Math.max(1, d))
}

/** ISO-dato for planlagt trekk; `day` klippes til siste gyldige dag i den måneden (f.eks. feb). */
export function formatBudgetDateIso(year: number, month1: number, day: number): string {
  const m = Math.min(12, Math.max(1, Math.floor(month1)))
  const mi = m - 1
  const raw = Math.floor(day)
  if (!Number.isFinite(raw)) return dateInMonth(year, mi, 1)
  return dateInMonth(year, mi, raw)
}

/**
 * Inkluderende månedsintervall innenfor ett kalenderår (1–12).
 * Returnerer tom liste hvis ugyldig rekkefølge.
 */
export function inclusiveMonthRangeInYear(
  startMonth1: number,
  endMonth1: number,
): { month1: number }[] {
  const a = Math.min(12, Math.max(1, Math.floor(startMonth1)))
  const b = Math.min(12, Math.max(1, Math.floor(endMonth1)))
  if (a > b) return []
  const out: { month1: number }[] = []
  for (let m = a; m <= b; m++) out.push({ month1: m })
  return out
}

export type PlannedSubTxParams = {
  subscriptionId: string
  label: string
  categoryName: string
  profileId: string
  amountNok: number
  billing: 'monthly' | 'yearly'
  budgetYear: number
  startMonth1: number
  endMonth1: number
  dayOfMonth: number
}

/** Én planlagt utgift per måned i intervallet (expense, Regninger-kategori). */
export function buildPlannedSubscriptionTransactions(p: PlannedSubTxParams): Transaction[] {
  const monthly = monthlyEquivalentNok({ amountNok: p.amountNok, billing: p.billing })
  if (monthly <= 0) return []
  const months = inclusiveMonthRangeInYear(p.startMonth1, p.endMonth1)
  const day = clampBillingDay(p.dayOfMonth)
  const desc = `${p.label.trim() || 'Abonnement'} (planlagt)`
  return months.map((row) => ({
    id: generateId(),
    date: formatBudgetDateIso(p.budgetYear, row.month1, day),
    description: desc,
    amount: monthly,
    category: p.categoryName,
    type: 'expense' as const,
    profileId: p.profileId,
    linkedServiceSubscriptionId: p.subscriptionId,
  }))
}

/**
 * Null ut budsjettert beløp fra og med avslutningsmåned (1–12), inkludert.
 * Eksportert for redigering av eksisterende kategori når avslutning er satt.
 */
export function zeroBudgetedFromCancellationMonth(
  budgeted: number[],
  cancelMonth1: number,
): number[] {
  const arr = Array.from({ length: 12 }, (_, i) => budgeted[i] ?? 0)
  const start = monthIndexFromOneBased(cancelMonth1)
  for (let i = start; i < 12; i++) arr[i] = 0
  return arr
}

export function parseIsoYearMonth(date: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(date.trim())
  if (!m) return null
  const year = parseInt(m[1]!, 10)
  const month = parseInt(m[2]!, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null
  return { year, month }
}

/**
 * Slett planlagte transaksjoner knyttet til abonnement fra og med avslutningsmåned (år+måned).
 */
export function transactionMatchesCancellationRemoval(
  t: Transaction,
  subscriptionId: string,
  cancelYear: number,
  cancelMonth1: number,
): boolean {
  if (t.linkedServiceSubscriptionId !== subscriptionId) return false
  const parsed = parseIsoYearMonth(t.date)
  if (!parsed) return false
  if (parsed.year < cancelYear) return false
  if (parsed.year > cancelYear) return true
  return parsed.month >= cancelMonth1
}

/**
 * Null ut planlagt budsjett for avsluttede abonnement der avslutningsår matcher aktivt budsjettår.
 * Idempotent: trygg å kalle ved årsskifte / gjenlasting.
 */
export function applySubscriptionCancellationsToBudgetForYear(
  person: PersonData,
  year: number,
): PersonData {
  let budgetCategories = person.budgetCategories
  for (const sub of person.serviceSubscriptions ?? []) {
    if (!sub.cancelledFrom || !sub.linkedBudgetCategoryId) continue
    if (sub.cancelledFrom.year !== year) continue
    const catId = sub.linkedBudgetCategoryId
    const m = sub.cancelledFrom.month
    budgetCategories = budgetCategories.map((c) => {
      if (c.id !== catId) return c
      return {
        ...c,
        budgeted: zeroBudgetedFromCancellationMonth(c.budgeted, m),
      }
    })
  }
  return { ...person, budgetCategories }
}
