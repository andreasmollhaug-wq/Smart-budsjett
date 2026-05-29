'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthFormShell from '@/components/auth/AuthFormShell'
import AuthLoadingCard from '@/components/auth/AuthLoadingCard'
import MfaTotpChallengeForm from '@/components/auth/MfaTotpChallengeForm'
import { needsMfaStepUp } from '@/lib/auth/mfa'
import { safeRedirectPath } from '@/lib/safeRedirectPath'
import { createClient } from '@/lib/supabase/client'

function TofaktorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeRedirectPath(searchParams.get('next'))
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.replace(`/logg-inn?next=${encodeURIComponent(next)}`)
        return
      }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (cancelled) return
      if (!needsMfaStepUp(aal)) {
        router.replace(next)
        return
      }
      setChecking(false)
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [router, next])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/logg-inn')
    router.refresh()
  }

  function handleSuccess() {
    router.push(next)
    router.refresh()
  }

  if (checking) {
    return <AuthLoadingCard label="Sjekker tofaktor…" />
  }

  return (
    <AuthFormShell title="Tofaktorautentisering" subtitle="Skriv inn kode fra autentiseringsappen">
      <MfaTotpChallengeForm onSuccess={handleSuccess} />
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-6 w-full text-center text-sm min-h-[44px] touch-manipulation"
        style={{ color: 'var(--text-muted)' }}
      >
        Avbryt og logg ut
      </button>
    </AuthFormShell>
  )
}

export default function LoggInnTofaktorPage() {
  return (
    <Suspense fallback={<AuthLoadingCard label="Laster tofaktor…" />}>
      <TofaktorForm />
    </Suspense>
  )
}
