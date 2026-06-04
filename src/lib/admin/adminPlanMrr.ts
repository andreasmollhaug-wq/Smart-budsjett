import { FAMILY_PRICE_NOK, SOLO_PRICE_NOK } from '@/lib/subscriptionPlans'
import type { AdminPlanMrrBreakdown, AdminSubscriberEntry } from '@/lib/admin/types'

export function formatAdminNok(amount: number): string {
  return `${new Intl.NumberFormat('nb-NO').format(amount)} kr`
}

export function computePlanMrrBreakdown(
  subscribers: AdminSubscriberEntry[],
  statuses: readonly string[],
): AdminPlanMrrBreakdown {
  const statusSet = new Set(statuses)
  const matched = subscribers.filter((s) => statusSet.has(s.status))

  let soloCount = 0
  let familyCount = 0
  let unknownPlanCount = 0

  for (const row of matched) {
    if (row.plan === 'solo') soloCount += 1
    else if (row.plan === 'family') familyCount += 1
    else unknownPlanCount += 1
  }

  const soloMrrNok = soloCount * SOLO_PRICE_NOK
  const familyMrrNok = familyCount * FAMILY_PRICE_NOK

  return {
    totalNok: soloMrrNok + familyMrrNok,
    solo: { count: soloCount, mrrNok: soloMrrNok, priceNok: SOLO_PRICE_NOK },
    family: { count: familyCount, mrrNok: familyMrrNok, priceNok: FAMILY_PRICE_NOK },
    unknownPlanCount,
  }
}

/** Potensiell MRR om alle i prøve konverterer. */
export function computeTrialPotentialMrr(subscribers: AdminSubscriberEntry[]): AdminPlanMrrBreakdown {
  return computePlanMrrBreakdown(subscribers, ['trialing'])
}

/** Faktisk MRR fra abonnement med Stripe-status active. */
export function computeActiveMrr(subscribers: AdminSubscriberEntry[]): AdminPlanMrrBreakdown {
  return computePlanMrrBreakdown(subscribers, ['active'])
}

export const ADMIN_MRR_MONTHS_PER_YEAR = 12

/** Skalerer beløp til årlig inntekt (MRR × 12); antall brukere uendret. */
export function scalePlanMrrToAnnual(mrr: AdminPlanMrrBreakdown): AdminPlanMrrBreakdown {
  const m = ADMIN_MRR_MONTHS_PER_YEAR
  return {
    totalNok: mrr.totalNok * m,
    solo: {
      count: mrr.solo.count,
      mrrNok: mrr.solo.mrrNok * m,
      priceNok: mrr.solo.priceNok * m,
    },
    family: {
      count: mrr.family.count,
      mrrNok: mrr.family.mrrNok * m,
      priceNok: mrr.family.priceNok * m,
    },
    unknownPlanCount: mrr.unknownPlanCount,
  }
}
