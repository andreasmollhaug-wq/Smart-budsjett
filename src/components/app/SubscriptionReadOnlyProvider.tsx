'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/** Tilgjengelig felt fra `/api/stripe/subscription` (stripe_subscription_id utelatt — ikke behøvd i UI). */
export type StripeSubscriptionSummary = {
  status: string
  plan: 'solo' | 'family' | null
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
})

export function SubscriptionReadOnlyProvider({ children }: { children: React.ReactNode }) {
  const [appReadOnly, setAppReadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState(false)
  const [enforcementEnabled, setEnforcementEnabled] = useState(false)
  const [trialPeriodDays, setTrialPeriodDays] = useState<number | null>(null)
  const [subscription, setSubscription] = useState<StripeSubscriptionSummary>(null)
  const [canOpenBillingPortal, setCanOpenBillingPortal] = useState(false)

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
        return
      }
      const data = (await res.json()) as {
        appReadOnly?: boolean
        hasSubscriptionAccess?: boolean
        enforcementEnabled?: boolean
        trialPeriodDays?: number | null
        subscription?: {
          status: string
          plan: 'solo' | 'family' | null
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
      if (
        row &&
        typeof row.status === 'string' &&
        typeof row.updated_at === 'string'
      ) {
        setSubscription({
          status: row.status,
          plan: row.plan ?? null,
          stripe_price_id: row.stripe_price_id ?? null,
          current_period_end: row.current_period_end ?? null,
          updated_at: row.updated_at,
        })
      } else {
        setSubscription(null)
      }
    } catch {
      setAppReadOnly(false)
      setHasSubscriptionAccess(false)
      setEnforcementEnabled(false)
      setTrialPeriodDays(null)
      setSubscription(null)
      setCanOpenBillingPortal(false)
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
    ],
  )

  return (
    <SubscriptionReadOnlyContext.Provider value={value}>{children}</SubscriptionReadOnlyContext.Provider>
  )
}

export function useSubscriptionReadOnly() {
  return useContext(SubscriptionReadOnlyContext)
}
