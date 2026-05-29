'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getVerifiedTotpFactorId, hasVerifiedTotpFactor } from '@/lib/auth/mfa'
import { mfaRecommendIntro, mfaLostDeviceNote, mfaEnrollMobileSteps } from '@/lib/kontoCopy'
import { CONTACT_EMAIL } from '@/lib/legal'

type PanelState = 'loading' | 'off' | 'enrolling' | 'on'

type Props = {
  /** Åpner «Slik gjør du det»-modal (trigger ligger i seksjonsoverskriften). */
  onOpenHowTo?: () => void
}

export default function MfaPanel({ onOpenHowTo }: Props) {
  const [state, setState] = useState<PanelState>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [enrollCode, setEnrollCode] = useState('')

  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)

  const openHowTo = onOpenHowTo ?? (() => {})

  const refreshStatus = useCallback(async () => {
    setError(null)
    const supabase = createClient()
    const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
    if (factorsErr) {
      setError('Kunne ikke hente tofaktor-status.')
      setState('off')
      return
    }
    setState(hasVerifiedTotpFactor(factors) ? 'on' : 'off')
  }, [])

  useEffect(() => {
    void refreshStatus().finally(() => {
      setState((s) => (s === 'loading' ? 'off' : s))
    })
  }, [refreshStatus])

  async function cancelEnrollment() {
    if (enrollFactorId) {
      const supabase = createClient()
      await supabase.auth.mfa.unenroll({ factorId: enrollFactorId })
    }
    setEnrollFactorId(null)
    setQrCode(null)
    setSecret(null)
    setEnrollCode('')
    setState('off')
  }

  async function startEnroll() {
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: existing } = await supabase.auth.mfa.listFactors()
      for (const factor of existing?.totp ?? []) {
        if (factor.status !== 'verified') {
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Dottir',
      })
      if (enrollErr || !data) {
        setError(enrollErr?.message ?? 'Kunne ikke starte aktivering.')
        return
      }
      setEnrollFactorId(data.id)
      setQrCode(data.totp?.qr_code ?? null)
      setSecret(data.totp?.secret ?? null)
      setEnrollCode('')
      setState('enrolling')
    } finally {
      setLoading(false)
    }
  }

  async function verifyEnrollment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = enrollCode.replace(/\s/g, '')
    if (trimmed.length !== 6 || !enrollFactorId) {
      setError('Skriv inn en 6-sifret kode.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: enrollFactorId,
      })
      if (challengeErr || !challenge?.id) {
        setError('Kunne ikke verifisere koden. Prøv igjen.')
        return
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code: trimmed,
      })
      if (verifyErr) {
        setError('Ugyldig kode. Sjekk autentiseringsappen og prøv igjen.')
        return
      }
      setMessage('2FA er aktivert.')
      setEnrollFactorId(null)
      setQrCode(null)
      setSecret(null)
      setEnrollCode('')
      await refreshStatus()
    } finally {
      setLoading(false)
    }
  }

  async function copySecret() {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret)
      setMessage('Hemmelig nøkkel kopiert.')
    } catch {
      setError('Kunne ikke kopiere. Marker og kopier manuelt.')
    }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) {
        setError('Fant ikke innlogget bruker.')
        return
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: disablePassword,
      })
      if (signErr) {
        setError('Feil passord.')
        return
      }
      const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
      if (factorsErr) {
        setError('Kunne ikke hente tofaktor-innstillinger.')
        return
      }
      const factorId = getVerifiedTotpFactorId(factors)
      if (!factorId) {
        setError('Fant ingen aktiv tofaktor.')
        await refreshStatus()
        return
      }
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollErr) {
        setError(unenrollErr.message)
        return
      }
      setMessage('2FA er deaktivert.')
      setDisablePassword('')
      setShowDisableForm(false)
      await refreshStatus()
    } finally {
      setLoading(false)
    }
  }

  if (state === 'loading') {
    return (
      <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>
        Laster tofaktor…
      </p>
    )
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <p className="text-sm mb-3 break-words" style={{ color: 'var(--text-muted)' }}>
        {mfaRecommendIntro}
      </p>

      {state === 'enrolling' && (
        <div className="space-y-4 mb-4 min-w-0">
          <p className="text-sm break-words" style={{ color: 'var(--text-muted)' }}>
            Følg stegene i autentiseringsappen.{' '}
            <button
              type="button"
              onClick={openHowTo}
              className="inline-block font-medium underline underline-offset-2 touch-manipulation min-h-[44px] py-2"
              style={{ color: 'var(--primary)' }}
            >
              Usikker? Se slik gjør du det
            </button>
          </p>
          {secret && (
            <div className="min-w-0 order-1 sm:order-none">
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Hemmelig nøkkel
              </p>
              <ol className="text-xs space-y-1 mb-3 list-decimal list-inside break-words" style={{ color: 'var(--text-muted)' }}>
                {mfaEnrollMobileSteps.map((step) => (
                  <li key={step} className="break-words">
                    {step}
                  </li>
                ))}
              </ol>
              <code
                className="block text-xs break-all rounded-xl px-3 py-2 font-mono overflow-x-auto"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {secret}
              </code>
              <button
                type="button"
                onClick={() => void copySecret()}
                className="mt-2 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
              >
                Kopier nøkkel
              </button>
            </div>
          )}

          {qrCode && (
            <div className="min-w-0 order-2 sm:order-none">
              <p className="text-sm mb-2 hidden sm:block" style={{ color: 'var(--text)' }}>
                På datamaskin: skann QR-koden med autentiseringsappen.
              </p>
              <details className="sm:hidden min-w-0">
                <summary
                  className="text-sm cursor-pointer min-h-[44px] flex items-center touch-manipulation"
                  style={{ color: 'var(--primary)' }}
                >
                  Har du en annen enhet? Vis QR-kode
                </summary>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode}
                  alt="QR-kode for tofaktor"
                  className="mx-auto mt-3 max-w-[min(100%,14rem)] w-full h-auto"
                />
              </details>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="QR-kode for tofaktor"
                className="mx-auto max-w-[min(100%,16rem)] w-full h-auto hidden sm:block"
              />
            </div>
          )}

          <form onSubmit={verifyEnrollment} className="space-y-3 min-w-0 order-3">
            <div>
              <label htmlFor="enroll-code" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Bekreft med 6-sifret kode
              </label>
              <input
                id="enroll-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 rounded-xl text-base sm:text-sm text-center tracking-widest min-h-[44px]"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                required
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading || enrollCode.length !== 6}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60 min-h-[44px] touch-manipulation"
                style={{ background: 'var(--primary)' }}
              >
                {loading ? 'Verifiserer…' : 'Fullfør aktivering'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void cancelEnrollment()}
                className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {state !== 'enrolling' && (
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 border-t min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm min-w-0" style={{ color: 'var(--text)' }}>
            {state === 'on' ? '2FA er aktivert' : '2FA er ikke aktivert'}
          </span>
          {state === 'off' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void startEnroll()}
              className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation shrink-0"
              style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
            >
              {loading ? 'Starter…' : 'Aktiver 2FA'}
            </button>
          )}
          {state === 'on' && !showDisableForm && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowDisableForm(true)
                setError(null)
                setMessage(null)
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation shrink-0"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Deaktiver
            </button>
          )}
        </div>
      )}

      {state === 'on' && showDisableForm && (
        <form onSubmit={disableMfa} className="mt-4 space-y-3 max-w-md">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Skriv inn passordet ditt for å deaktivere tofaktor.
          </p>
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-xl text-sm min-h-[44px]"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            required
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60 min-h-[44px] touch-manipulation"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Deaktiverer…' : 'Bekreft deaktivering'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowDisableForm(false)
                setDisablePassword('')
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {state === 'on' && !showDisableForm && (
        <p className="text-xs mt-3 break-words" style={{ color: 'var(--text-muted)' }}>
          {mfaLostDeviceNote}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline break-all" style={{ color: 'var(--primary)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      )}

      {message && (
        <p className="text-sm mt-3 break-words" style={{ color: 'var(--primary)' }}>
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm mt-3 break-words" style={{ color: '#c92a2a' }}>
          {error}
        </p>
      )}
    </div>
  )
}
