'use client'

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLoadingCard from '@/components/auth/AuthLoadingCard'
import type { FormFeedback } from '@/lib/formFeedback'

/**
 * Etter e-postlenke for glemt passord emitter Supabase ofte PASSWORD_RECOVERY; da vises skjemaet.
 * Etter server-side /auth/callback (PKCE) kommer ikke alltid den hendelsen — da brukes ?recovery=1.
 * Uten recovery-sesjon ventes RECOVERY_REDIRECT_MS før vi antar vanlig innlogget økt og redirecter til Konto.
 */
const RECOVERY_REDIRECT_MS = 8000
const NO_SESSION_GIVEUP_MS = 12000
const RECOVERY_POLL_MS = 150

function TilbakestillPassordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recoveryIntent = searchParams.get('recovery') === '1'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedback>(null)
  const [phase, setPhase] = useState<'checking' | 'recovery'>('checking')
  const recoverySeen = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY') {
        recoverySeen.current = true
        setPhase('recovery')
      }
    })

    const poll = window.setInterval(() => {
      if (cancelled) return
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return
        if (recoveryIntent && session) {
          recoverySeen.current = true
          setPhase('recovery')
        }
      })
    }, RECOVERY_POLL_MS)

    const pollStop = window.setTimeout(() => {
      window.clearInterval(poll)
    }, NO_SESSION_GIVEUP_MS)

    const redirectNonRecoveryTimer = window.setTimeout(() => {
      if (cancelled || recoverySeen.current) return
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || recoverySeen.current) return
        if (session) {
          router.replace('/konto/sikkerhet?info=passord-konto')
        }
      })
    }, RECOVERY_REDIRECT_MS)

    const giveUpTimer = window.setTimeout(() => {
      if (cancelled || recoverySeen.current) return
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || recoverySeen.current) return
        if (!session) {
          router.replace('/logg-inn?error=session')
        }
      })
    }, NO_SESSION_GIVEUP_MS)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.clearInterval(poll)
      window.clearTimeout(pollStop)
      window.clearTimeout(redirectNonRecoveryTimer)
      window.clearTimeout(giveUpTimer)
    }
  }, [router, recoveryIntent])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFeedback(null)
    if (password.length < 8) {
      setFeedback({ variant: 'error', text: 'Passordet må ha minst 8 tegn.' })
      return
    }
    if (password !== confirm) {
      setFeedback({ variant: 'error', text: 'Passordene er ikke like.' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setFeedback({ variant: 'error', text: error.message })
        return
      }
      setFeedback({ variant: 'success', text: 'Passordet er oppdatert. Omdirigerer…' })
      setTimeout(() => {
        router.replace('/dashboard')
        router.refresh()
      }, 800)
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'checking') {
    return <AuthLoadingCard label="Kobler til økt…" />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Sett nytt passord
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Velg et nytt passord for kontoen din.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-pw" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Nytt passord
            </label>
            <input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label htmlFor="confirm-pw" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Bekreft passord
            </label>
            <input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          {feedback && (
            <p
              className="text-sm"
              style={{ color: feedback.variant === 'success' ? 'var(--primary)' : '#c92a2a' }}
            >
              {feedback.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            {loading ? 'Lagrer…' : 'Lagre nytt passord'}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link href="/logg-inn" className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tilbake til innlogging
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function TilbakestillPassordPage() {
  return (
    <Suspense fallback={<AuthLoadingCard label="Kobler til økt…" />}>
      <TilbakestillPassordContent />
    </Suspense>
  )
}
