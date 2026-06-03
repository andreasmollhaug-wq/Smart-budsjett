export type AdminMetricsPayload = {
  generatedAt: string
  timezone: 'Europe/Oslo'
  pulse: {
    todayLabel: string
    yesterdayLabel: string
    registrations: { today: number; yesterday: number; priorDay: number }
    confirmed: { today: number; yesterday: number; priorDay: number }
    checkouts: { today: number; yesterday: number; priorDay: number }
  }
  subscription: {
    trialing: number
    active: number
    past_due: number
    canceled: number
  }
  funnel: {
    registered: number
    emailConfirmed: number
    checkoutCompleted: number
    conversion: {
      confirmedPctOfRegistered: number | null
      checkoutPctOfConfirmed: number | null
      checkoutPctOfRegistered: number | null
    }
  }
  weekly: Array<{
    weekStart: string
    weekLabel: string
    registrations: number
    confirmed: number
  }>
  daily: Array<{
    dateKey: string
    dayLabel: string
    isToday: boolean
    registrations: number
    confirmed: number
    checkouts: number
  }>
  dailyTotals: {
    registrations: number
    confirmed: number
    checkouts: number
  }
}

export type AdminAccessFailureReason =
  | 'unauthenticated'
  | 'no_email'
  | 'not_allowlisted'
  | 'mfa_not_enrolled'
  | 'mfa_step_up_required'
  | 'config'

export type AdminAccessResult =
  | { ok: true; email: string }
  | { ok: false; reason: AdminAccessFailureReason }

export type AdminAuthUserSnapshot = {
  createdAt: string | null
  emailConfirmedAt: string | null
}

export type AdminSubscriptionRow = {
  status: string
  stripe_subscription_id: string | null
  first_checkout_at: string | null
}
