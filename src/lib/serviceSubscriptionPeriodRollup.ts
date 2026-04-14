import { MONTH_LABELS_SHORT_NB } from '@/lib/bankReportData'
import type { ServiceSubscription } from '@/lib/store'

export type ServiceSubscriptionMonthPoint = {
  monthLabel: string
  monthIndex: number
  /** Sum månedlig ekvivalent for aktive abo denne måneden */
  costNok: number
}

/** Kalendermåned 1–12 er aktivt før avslutning (avslutt «fra og med» cancelledFrom.måned). */
export function isServiceSubscriptionActiveInMonth(
  sub: ServiceSubscription,
  year: number,
  monthIndex0: number,
): boolean {
  if (!sub.active) return false
  const month1 = monthIndex0 + 1
  const cf = sub.cancelledFrom
  if (cf) {
    if (year > cf.year) return false
    if (year === cf.year && month1 >= cf.month) return false
  }
  return true
}

function monthlyEquivalentNok(sub: ServiceSubscription): number {
  return sub.billing === 'yearly' ? sub.amountNok / 12 : sub.amountNok
}

/**
 * Summerer månedlig kostnad for tjenesteabonnementer i [startMonth..endMonth] for filterYear.
 * Årlig abonnement fordeles likt på 12 måneder per måned det er aktivt.
 */
export function rollupServiceSubscriptionsCostForPeriod(
  subs: ServiceSubscription[],
  filterYear: number,
  startMonthInclusive: number,
  endMonthInclusive: number,
): { totalNok: number; uniqueIdsInPeriod: number } {
  const activeIds = new Set<string>()
  let totalNok = 0

  for (let m = startMonthInclusive; m <= endMonthInclusive; m++) {
    for (const sub of subs) {
      if (!isServiceSubscriptionActiveInMonth(sub, filterYear, m)) continue
      activeIds.add(sub.id)
      totalNok += monthlyEquivalentNok(sub)
    }
  }

  return { totalNok, uniqueIdsInPeriod: activeIds.size }
}

/** Én rad per måned i [startMonthInclusive, endMonthInclusive] — samme regler som `rollupServiceSubscriptionsCostForPeriod`. */
export function buildServiceSubscriptionMonthlyCostForPeriod(
  subs: ServiceSubscription[],
  filterYear: number,
  startMonthInclusive: number,
  endMonthInclusive: number,
): ServiceSubscriptionMonthPoint[] {
  const out: ServiceSubscriptionMonthPoint[] = []
  for (let m = startMonthInclusive; m <= endMonthInclusive; m++) {
    let costNok = 0
    for (const sub of subs) {
      if (!isServiceSubscriptionActiveInMonth(sub, filterYear, m)) continue
      costNok += monthlyEquivalentNok(sub)
    }
    out.push({
      monthLabel: MONTH_LABELS_SHORT_NB[m] ?? String(m + 1),
      monthIndex: m,
      costNok,
    })
  }
  return out
}
