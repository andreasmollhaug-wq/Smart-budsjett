import { ADMIN_METRICS_TIMEZONE } from '@/lib/admin/adminMetricsTime'
import { subscriptionPlanCopy } from '@/lib/subscriptionPlans'
import type { AdminAuthUserDirectoryEntry, AdminSubscriptionDetailRow, AdminSubscriberEntry } from '@/lib/admin/types'

export function formatSubscriberRegisteredLabel(registeredAt: string | null): string | null {
  if (!registeredAt) return null
  const ms = Date.parse(registeredAt)
  if (!Number.isFinite(ms)) return null
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: ADMIN_METRICS_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms))
}

const ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due', 'legacy_grandfathered'])

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Prøveperiode',
  active: 'Aktiv',
  past_due: 'Forfalt betaling',
  legacy_grandfathered: 'Bestefar',
  canceled: 'Kansellert',
  inactive: 'Inaktiv',
}

const STATUS_SORT: Record<string, number> = {
  active: 0,
  trialing: 1,
  past_due: 2,
  legacy_grandfathered: 3,
}

export function planLabelForAdmin(plan: AdminSubscriptionDetailRow['plan']): string {
  if (plan === 'solo') return subscriptionPlanCopy.solo.title
  if (plan === 'family') return subscriptionPlanCopy.family.title
  return 'Ukjent plan'
}

export function statusLabelForAdmin(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function buildAdminSubscriberList(
  directory: Map<string, AdminAuthUserDirectoryEntry>,
  rows: AdminSubscriptionDetailRow[],
): AdminSubscriberEntry[] {
  const entries: AdminSubscriberEntry[] = []

  for (const row of rows) {
    if (!ACTIVE_STATUSES.has(row.status)) continue

    const user = directory.get(row.user_id)
    const email = user?.email?.trim() ?? ''
    if (!email) continue

    entries.push({
      userId: row.user_id,
      email,
      displayName: user?.displayName ?? null,
      plan: row.plan,
      planLabel: planLabelForAdmin(row.plan),
      status: row.status,
      statusLabel: statusLabelForAdmin(row.status),
      hasStripeSubscription: Boolean(row.stripe_subscription_id),
      registeredAt: user?.registeredAt ?? null,
      registeredLabel: formatSubscriberRegisteredLabel(user?.registeredAt ?? null),
    })
  }

  entries.sort((a, b) => {
    const sa = STATUS_SORT[a.status] ?? 99
    const sb = STATUS_SORT[b.status] ?? 99
    if (sa !== sb) return sa - sb
    const planCmp = a.planLabel.localeCompare(b.planLabel, 'nb')
    if (planCmp !== 0) return planCmp
    const nameA = a.displayName ?? a.email
    const nameB = b.displayName ?? b.email
    return nameA.localeCompare(nameB, 'nb')
  })

  return entries
}
