'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getVerifiedTotpFactorId } from '@/lib/auth/mfa'

type Props = {
  onSuccess: () => void
  submitLabel?: string
}

export default function MfaTotpChallengeForm({ onSuccess, submitLabel = 'Bekreft' }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [initLoading, setInitLoading] = useState(true)

  const prepareChallenge = useCallback(async () => {
    setInitLoading(true)
    setInitError(null)
    try {
      const supabase = createClient()
      const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
      if (factorsErr) {
        setInitError('Kunne ikke hente tofaktor-innstillinger.')
        return
      }
      const id = getVerifiedTotpFactorId(factors)
      if (!id) {
        setInitError('Fant ingen aktiv tofaktor for kontoen.')
        return
      }
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: id })
      if (challengeErr || !challenge?.id) {
        setInitError('Kunne ikke starte tofaktor-verifisering.')
        return
      }
      setFactorId(id)
      setChallengeId(challenge.id)
    } finally {
      setInitLoading(false)
    }
  }, [])

  useEffect(() => {
    void prepareChallenge()
  }, [prepareChallenge])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = code.replace(/\s/g, '')
    if (trimmed.length !== 6) {
      setError('Skriv inn en 6-sifret kode.')
      return
    }
    if (!factorId || !challengeId) {
      setError('Verifisering er ikke klar. Prøv å laste siden på nytt.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: trimmed,
      })
      if (verifyErr) {
        setError('Ugyldig kode. Sjekk autentiseringsappen og prøv igjen.')
        await prepareChallenge()
        setCode('')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        Forbereder tofaktor…
      </p>
    )
  }

  if (initError) {
    return (
      <p className="text-sm text-center" style={{ color: '#c92a2a' }}>
        {initError}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Skriv inn 6-sifret kode fra autentiseringsappen din.
      </p>
      <div>
        <label htmlFor="mfa-code" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Engangskode
        </label>
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full rounded-xl px-3 py-2.5 text-base sm:text-sm text-center tracking-widest min-h-[44px]"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          autoFocus
          required
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: '#c92a2a' }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60 min-h-[44px] touch-manipulation"
        style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
      >
        {loading ? 'Verifiserer…' : submitLabel}
      </button>
    </form>
  )
}
