'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLoadingCard from '@/components/auth/AuthLoadingCard'
import type { FormFeedback } from '@/lib/formFeedback'

export default function GlemtPassordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedback>(null)
  const [alreadyIn, setAlreadyIn] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!cancelled) setAlreadyIn(Boolean(user))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFeedback(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setFeedback({ variant: 'error', text: 'Skriv inn e-postadressen din.' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/tilbakestill-passord')}`,
      })
      if (error) {
        setFeedback({ variant: 'error', text: error.message })
        return
      }
      setFeedback({
        variant: 'success',
        text: 'Hvis det finnes en konto med denne e-posten, har vi sendt en lenke for å sette nytt passord. Sjekk innboksen (og søppelpost).',
      })
    } finally {
      setLoading(false)
    }
  }

  if (alreadyIn === null) {
    return <AuthLoadingCard />
  }

  if (alreadyIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div
          className="w-full max-w-md rounded-2xl p-8 shadow-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Du er allerede innlogget
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Endre passord under Konto → Sikkerhet, eller logg ut først hvis du vil bruke e-postlenke for tilbakestilling.
          </p>
          <Link
            href="/konto/sikkerhet"
            className="inline-block rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            Gå til Sikkerhet
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Glemt passord
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Skriv inn e-posten du brukte ved registrering. Du får en lenke for å sette nytt passord.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="glemt-email" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              E-post
            </label>
            <input
              id="glemt-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'Sender…' : 'Send lenke'}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link href="/logg-inn" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
            Tilbake til innlogging
          </Link>
        </p>
      </div>
    </div>
  )
}
