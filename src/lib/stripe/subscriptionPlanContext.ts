import { getEffectiveSubscriptionPlan } from '@/lib/stripe/getEffectiveSubscriptionPlan'
import { hasSubscriptionAccess } from '@/lib/stripe/subscriptionAccess'
import type { BillingPlanSnapshot, SyncAppPlanResult } from '@/lib/stripe/syncAppSubscriptionPlan'
import type { SubscriptionPlan } from '@/lib/store'

export function billingSnapshotFromStripeRow(
  row: { status: string; plan: 'solo' | 'family' | null } | null | undefined,
): BillingPlanSnapshot | null {
  if (!row || typeof row.status !== 'string') return null
  const plan =
    row.plan === 'solo' || row.plan === 'family' ? row.plan : null
  return { status: row.status, plan }
}

export function planSyncBlockedFromResult(
  result: SyncAppPlanResult | null | undefined,
): { stripePlan: 'solo'; profileCount: number } | null {
  if (result?.action === 'blocked_downgrade') {
    return { stripePlan: result.stripePlan, profileCount: result.profileCount }
  }
  return null
}

export function computePlanMismatch(
  localPlan: SubscriptionPlan,
  billing: BillingPlanSnapshot | null | undefined,
): boolean {
  if (!billing?.plan || !hasSubscriptionAccess(billing.status)) return false
  return billing.plan !== localPlan
}

export function computeEffectiveSubscriptionPlan(
  localPlan: SubscriptionPlan,
  billing: BillingPlanSnapshot | null | undefined,
): SubscriptionPlan {
  return getEffectiveSubscriptionPlan(localPlan, billing ?? undefined)
}
