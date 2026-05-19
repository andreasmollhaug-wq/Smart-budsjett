'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import type { BillingPlan, BillingPlanSnapshot, SyncAppPlanResult } from '@/lib/stripe/syncAppSubscriptionPlan'
import {
  billingSnapshotFromStripeRow,
  computeEffectiveSubscriptionPlan,
  computePlanMismatch,
  planSyncBlockedFromResult,
} from '@/lib/stripe/subscriptionPlanContext'
import type { SubscriptionPlan } from '@/lib/store'

/** Tilgjengelig felt fra `/api/stripe/subscription` (stripe_subscription_id utelatt — ikke behøvd i UI). */
export type StripeSubscriptionSummary = {
  status: string
  plan: BillingPlan | null
  stripe_price_id: string | null
  current_period_end: string | null
  updated_at: string
} | null

type Ctx = {
  appReadOnly: boolean
  loading: boolean
  refresh: () => void
  /** Stripe active / trialing / past_due */
  hasSubscriptionAccess: boolean
  enforcementEnabled: boolean
  /** null = ingen prøveperiode i Checkout-konfig */
  trialPeriodDays: number | null
  subscription: StripeSubscriptionSummary
  canOpenBillingPortal: boolean
  billingPlan: BillingPlan | null
  effectiveSubscriptionPlan: SubscriptionPlan
  planSyncBlocked: { stripePlan: 'solo'; profileCount: number } | null
  planMismatch: boolean
  lastBillingSnapshot: BillingPlanSnapshot | null
}

const SubscriptionReadOnlyContext = createContext<Ctx>({
  appReadOnly: false,
  loading: true,
  refresh: () => {},
  hasSubscriptionAccess: false,
  enforcementEnabled: false,
  trialPeriodDays: null,
  subscription: null,
  canOpenBillingPortal: false,
  billingPlan: null,
  effectiveSubscriptionPlan: 'solo',
  planSyncBlocked: null,
  planMismatch: false,
  lastBillingSnapshot: null,
})

function applySubscriptionRowToStore(
  row: { status: string; plan: BillingPlan | null } | null,
): SyncAppPlanResult | null {
  const billing = billingSnapshotFromStripeRow(row)
  if (!billing) return null
  return useStore.getState().applyBillingPlanSync(billing)
}

export function SubscriptionReadOnlyProvider({
  children,
  initialBilling,
}: {
  children: React.ReactNode
  initialBilling?: BillingPlanSnapshot | null
}) {
  const [appReadOnly, setAppReadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState(false)
  const [enforcementEnabled, setEnforcementEnabled] = useState(false)
  const [trialPeriodDays, setTrialPeriodDays] = useState<number | null>(null)
  const [subscription, setSubscription] = useState<StripeSubscriptionSummary>(null)
  const [canOpenBillingPortal, setCanOpenBillingPortal] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncAppPlanResult | null>(null)

  const localPlan = useStore((s) => s.subscriptionPlan)
  const lastBillingSnapshot = useStore((s) => s.lastBillingSnapshot)

  useEffect(() => {
    if (!initialBilling) return
    const result = useStore.getState().applyBillingPlanSync(initialBilling)
    setLastSyncResult(result)
  }, [initialBilling])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/subscription')
      if (!res.ok) {
        setAppReadOnly(false)
        setHasSubscriptionAccess(false)
        setEnforcementEnabled(false)
        setTrialPeriodDays(null)
        setSubscription(null)
        setCanOpenBillingPortal(false)
        setLastSyncResult(null)
        return
      }
      const data = (await res.json()) as {
        appReadOnly?: boolean
        hasSubscriptionAccess?: boolean
        enforcementEnabled?: boolean
        trialPeriodDays?: number | null
        subscription?: {
          status: string
          plan: BillingPlan | null
          stripe_price_id: string | null
          current_period_end: string | null
          updated_at: string
        } | null
        canOpenBillingPortal?: boolean
      }
      setAppReadOnly(data.appReadOnly === true)
      setHasSubscriptionAccess(data.hasSubscriptionAccess === true)
      setEnforcementEnabled(data.enforcementEnabled === true)
      setTrialPeriodDays(typeof data.trialPeriodDays === 'number' ? data.trialPeriodDays : null)
      setCanOpenBillingPortal(Boolean(data.canOpenBillingPortal))
      const row = data.subscription
      if (row && typeof row.status === 'string' && typeof row.updated_at === 'string') {
        const summary: StripeSubscriptionSummary = {
          status: row.status,
          plan: row.plan ?? null,
          stripe_price_id: row.stripe_price_id ?? null,
          current_period_end: row.current_period_end ?? null,
          updated_at: row.updated_at,
        }
        setSubscription(summary)
        const syncResult = applySubscriptionRowToStore(summary)
        setLastSyncResult(syncResult)
      } else {
        setSubscription(null)
        setLastSyncResult(null)
      }
    } catch {
      setAppReadOnly(false)
      setHasSubscriptionAccess(false)
      setEnforcementEnabled(false)
      setTrialPeriodDays(null)
      setSubscription(null)
      setCanOpenBillingPortal(false)
      setLastSyncResult(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const billingForUi =
    subscription != null
      ? { plan: subscription.plan, status: subscription.status }
      : lastBillingSnapshot

  const effectiveSubscriptionPlan = useMemo(
    () => computeEffectiveSubscriptionPlan(localPlan, billingForUi),
    [localPlan, billingForUi],
  )

  const planMismatch = useMemo(
    () => computePlanMismatch(localPlan, billingForUi),
    [localPlan, billingForUi],
  )

  const planSyncBlocked = useMemo(
    () => planSyncBlockedFromResult(lastSyncResult),
    [lastSyncResult],
  )

  const value = useMemo(
    () => ({
      appReadOnly,
      loading,
      refresh: load,
      hasSubscriptionAccess,
      enforcementEnabled,
      trialPeriodDays,
      subscription,
      canOpenBillingPortal,
      billingPlan: subscription?.plan ?? null,
      effectiveSubscriptionPlan,
      planSyncBlocked,
      planMismatch,
      lastBillingSnapshot,
    }),
    [
      appReadOnly,
      loading,
      load,
      hasSubscriptionAccess,
      enforcementEnabled,
      trialPeriodDays,
      subscription,
      canOpenBillingPortal,
      effectiveSubscriptionPlan,
      planSyncBlocked,
      planMismatch,
      lastBillingSnapshot,
    ],
  )

  return (
    <SubscriptionReadOnlyContext.Provider value={value}>{children}</SubscriptionReadOnlyContext.Provider>
  )
}

export function useSubscriptionReadOnly() {
  return useContext(SubscriptionReadOnlyContext)
}
