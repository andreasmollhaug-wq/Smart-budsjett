'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

type Ctx = {
  appReadOnly: boolean
  loading: boolean
  refresh: () => void
  /** Stripe active / trialing / past_due */
  hasSubscriptionAccess: boolean
  enforcementEnabled: boolean
  /** null = ingen prøveperiode i Checkout-konfig */
  trialPeriodDays: number | null
}

const SubscriptionReadOnlyContext = createContext<Ctx>({
  appReadOnly: false,
  loading: true,
  refresh: () => {},
  hasSubscriptionAccess: false,
  enforcementEnabled: false,
  trialPeriodDays: null,
})

export function SubscriptionReadOnlyProvider({ children }: { children: React.ReactNode }) {
  const [appReadOnly, setAppReadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasSubscriptionAccess, setHasSubscriptionAccess] = useState(false)
  const [enforcementEnabled, setEnforcementEnabled] = useState(false)
  const [trialPeriodDays, setTrialPeriodDays] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/subscription')
      if (!res.ok) {
        setAppReadOnly(false)
        setHasSubscriptionAccess(false)
        setEnforcementEnabled(false)
        setTrialPeriodDays(null)
        return
      }
      const data = (await res.json()) as {
        appReadOnly?: boolean
        hasSubscriptionAccess?: boolean
        enforcementEnabled?: boolean
        trialPeriodDays?: number | null
      }
      setAppReadOnly(data.appReadOnly === true)
      setHasSubscriptionAccess(data.hasSubscriptionAccess === true)
      setEnforcementEnabled(data.enforcementEnabled === true)
      setTrialPeriodDays(typeof data.trialPeriodDays === 'number' ? data.trialPeriodDays : null)
    } catch {
      setAppReadOnly(false)
      setHasSubscriptionAccess(false)
      setEnforcementEnabled(false)
      setTrialPeriodDays(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const pathname = usePathname()
  useEffect(() => {
    void load()
  }, [load, pathname])

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
    }),
    [appReadOnly, loading, load, hasSubscriptionAccess, enforcementEnabled, trialPeriodDays],
  )

  return (
    <SubscriptionReadOnlyContext.Provider value={value}>{children}</SubscriptionReadOnlyContext.Provider>
  )
}

export function useSubscriptionReadOnly() {
  return useContext(SubscriptionReadOnlyContext)
}
