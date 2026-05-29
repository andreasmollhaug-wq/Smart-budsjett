'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hasVerifiedTotpFactor } from '@/lib/auth/mfa'
import { mfaRecommendShort } from '@/lib/kontoCopy'

const STORAGE_KEY = 'mfaRecommendBannerDismissed'

type Props = {
  showWhenTrialWelcome?: boolean
}

/** Engangs anbefaling om 2FA etter registrering / velkomst til betalinger. */
export default function MfaRecommendBanner({ showWhenTrialWelcome = false }: Props) {
  const searchParams = useSearchParams()
  const trialWelcome = searchParams.get('trial') === 'welcome'
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!showWhenTrialWelcome && !trialWelcome) {
      setChecking(false)
      return
    }
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1') {
      setChecking(false)
      return
    }

    let cancelled = false
    async function check() {
      const supabase = createClient()
      const { data: factors, error } = await supabase.auth.mfa.listFactors()
      if (cancelled) return
      if (error) {
        setChecking(false)
        return
      }
      if (!hasVerifiedTotpFactor(factors)) {
        setVisible(true)
      }
      setChecking(false)
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [showWhenTrialWelcome, trialWelcome])

  function dismiss() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, '1')
    }
    setVisible(false)
  }

  if (checking || !visible) return null

  return (
    <div
      className="mb-6 rounded-xl px-4 py-4 min-w-0"
      style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
      role="status"
    >
      <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
        {mfaRecommendShort}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/konto/sikkerhet"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white min-h-[44px] touch-manipulation"
          style={{ background: 'var(--primary)' }}
        >
          Gå til Sikkerhet
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          Ikke nå
        </button>
      </div>
    </div>
  )
}
