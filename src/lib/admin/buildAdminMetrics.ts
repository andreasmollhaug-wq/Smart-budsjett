import {
  ADMIN_METRICS_TIMEZONE,
  dayBeforeYesterdayRangeUtcMs,
  formatWeekLabel,
  isTimestampInRange,
  recentCalendarDayRangesUtcMs,
  recentWeekStartsUtcMs,
  todaySoFarRangeUtcMs,
  weekRangeUtcMs,
  yesterdayRangeUtcMs,
} from '@/lib/admin/adminMetricsTime'
import { computeActiveMrr, computeTrialPotentialMrr } from '@/lib/admin/adminPlanMrr'
import type {
  AdminAuthUserSnapshot,
  AdminMetricsPayload,
  AdminSubscriptionRow,
} from '@/lib/admin/types'

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

function countInRange(
  snapshots: AdminAuthUserSnapshot[],
  field: 'createdAt' | 'emailConfirmedAt',
  startMs: number,
  endMsExclusive: number,
): number {
  return snapshots.filter((s) =>
    isTimestampInRange(s[field], startMs, endMsExclusive),
  ).length
}

function countCheckoutsInRange(
  rows: AdminSubscriptionRow[],
  startMs: number,
  endMsExclusive: number,
): number {
  return rows.filter(
    (r) =>
      r.stripe_subscription_id &&
      isTimestampInRange(r.first_checkout_at, startMs, endMsExclusive),
  ).length
}

export function buildAdminMetrics(
  authUsers: AdminAuthUserSnapshot[],
  subscriptions: AdminSubscriptionRow[],
  subscribers: AdminMetricsPayload['subscribers'] = [],
  nowMs: number = Date.now(),
): AdminMetricsPayload {
  const yesterday = yesterdayRangeUtcMs(nowMs)
  const dayBefore = dayBeforeYesterdayRangeUtcMs(nowMs)
  const today = todaySoFarRangeUtcMs(nowMs)
  const todayLabel = new Intl.DateTimeFormat('nb-NO', {
    timeZone: ADMIN_METRICS_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(today.startMs))
  const yesterdayLabel = new Intl.DateTimeFormat('nb-NO', {
    timeZone: ADMIN_METRICS_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(yesterday.startMs))

  const emailConfirmed = authUsers.filter((u) => u.emailConfirmedAt).length
  const checkoutCompleted = subscriptions.filter((s) => s.stripe_subscription_id).length

  const statusCount = (status: string) =>
    subscriptions.filter((s) => s.status === status).length

  const weekStarts = recentWeekStartsUtcMs(nowMs, 12)
  const weekly = weekStarts.map((weekStartMs) => {
    const { startMs, endMsExclusive } = weekRangeUtcMs(weekStartMs)
    return {
      weekStart: new Date(weekStartMs).toISOString(),
      weekLabel: formatWeekLabel(weekStartMs),
      registrations: countInRange(authUsers, 'createdAt', startMs, endMsExclusive),
      confirmed: countInRange(authUsers, 'emailConfirmedAt', startMs, endMsExclusive),
      checkouts: countCheckoutsInRange(subscriptions, startMs, endMsExclusive),
    }
  })

  const daily = recentCalendarDayRangesUtcMs(nowMs, 30).map((day) => ({
    dateKey: day.dateKey,
    dayLabel: day.dayLabel,
    isToday: day.isToday,
    registrations: countInRange(authUsers, 'createdAt', day.startMs, day.endMsExclusive),
    confirmed: countInRange(authUsers, 'emailConfirmedAt', day.startMs, day.endMsExclusive),
    checkouts: countCheckoutsInRange(subscriptions, day.startMs, day.endMsExclusive),
  }))

  const dailyTotals = daily.reduce(
    (acc, row) => ({
      registrations: acc.registrations + row.registrations,
      confirmed: acc.confirmed + row.confirmed,
      checkouts: acc.checkouts + row.checkouts,
    }),
    { registrations: 0, confirmed: 0, checkouts: 0 },
  )

  return {
    generatedAt: new Date(nowMs).toISOString(),
    timezone: ADMIN_METRICS_TIMEZONE,
    pulse: {
      todayLabel,
      yesterdayLabel,
      registrations: {
        today: countInRange(authUsers, 'createdAt', today.startMs, today.endMsExclusive),
        yesterday: countInRange(authUsers, 'createdAt', yesterday.startMs, yesterday.endMsExclusive),
        priorDay: countInRange(authUsers, 'createdAt', dayBefore.startMs, dayBefore.endMsExclusive),
      },
      confirmed: {
        today: countInRange(
          authUsers,
          'emailConfirmedAt',
          today.startMs,
          today.endMsExclusive,
        ),
        yesterday: countInRange(
          authUsers,
          'emailConfirmedAt',
          yesterday.startMs,
          yesterday.endMsExclusive,
        ),
        priorDay: countInRange(
          authUsers,
          'emailConfirmedAt',
          dayBefore.startMs,
          dayBefore.endMsExclusive,
        ),
      },
      checkouts: {
        today: countCheckoutsInRange(subscriptions, today.startMs, today.endMsExclusive),
        yesterday: countCheckoutsInRange(
          subscriptions,
          yesterday.startMs,
          yesterday.endMsExclusive,
        ),
        priorDay: countCheckoutsInRange(
          subscriptions,
          dayBefore.startMs,
          dayBefore.endMsExclusive,
        ),
      },
    },
    subscription: {
      trialing: statusCount('trialing'),
      active: statusCount('active'),
      past_due: statusCount('past_due'),
      canceled: statusCount('canceled'),
    },
    funnel: {
      registered: authUsers.length,
      emailConfirmed,
      checkoutCompleted,
      conversion: {
        confirmedPctOfRegistered: pct(emailConfirmed, authUsers.length),
        checkoutPctOfConfirmed: pct(checkoutCompleted, emailConfirmed),
        checkoutPctOfRegistered: pct(checkoutCompleted, authUsers.length),
      },
    },
    weekly,
    daily,
    dailyTotals,
    subscribers,
    trialPotentialMrr: computeTrialPotentialMrr(subscribers),
    activeMrr: computeActiveMrr(subscribers),
  }
}

export async function fetchSubscriptionDetailRows(
  admin: import('@supabase/supabase-js').SupabaseClient,
): Promise<import('@/lib/admin/types').AdminSubscriptionDetailRow[]> {
  const { data, error } = await admin
    .from('user_subscription')
    .select('user_id, status, stripe_subscription_id, first_checkout_at, plan')
  if (error) throw error
  return (data ?? []) as import('@/lib/admin/types').AdminSubscriptionDetailRow[]
}

/** Delta-tekst for pulse-kort (sammenligning mot forrige periode). */
export function formatPulseDelta(
  current: number,
  compare: number,
  compareLabel = 'dagen før',
): {
  sub: string
  trend?: 'up' | 'down'
} {
  const delta = current - compare
  if (delta === 0) return { sub: `Samme som ${compareLabel}` }
  if (delta > 0) return { sub: `+${delta} vs ${compareLabel}`, trend: 'up' }
  return { sub: `${delta} vs ${compareLabel}`, trend: 'down' }
}

export async function fetchSubscriptionMetricsRows(
  admin: import('@supabase/supabase-js').SupabaseClient,
): Promise<AdminSubscriptionRow[]> {
  const { data, error } = await admin
    .from('user_subscription')
    .select('status, stripe_subscription_id, first_checkout_at')
  if (error) throw error
  return (data ?? []) as AdminSubscriptionRow[]
}
