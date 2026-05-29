'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSiteUrl } from '@/lib/site-url'
import { openBankConsentUrl } from '@/lib/neonomics/openBankConsent'

export type NeonomicsConsentMessage = {
  type: 'neonomics-consent-ok'
  profileId: string
  bankId: string
}

type Props = {
  children: (openConsent: (bankAuthUrl: string, bankDisplayName: string) => void) => React.ReactNode
  onConsentComplete?: (msg: NeonomicsConsentMessage) => void
}

export default function NeonomicsConsentLauncher({
  children,
  onConsentComplete,
}: Props) {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [navigateMode, setNavigateMode] = useState(false)
  const [consentBankName, setConsentBankName] = useState('banken')
  const popupRef = useRef<Window | null>(null)
  const expectedOriginRef = useRef<string>('')

  useEffect(() => {
    try {
      expectedOriginRef.current = new URL(getSiteUrl()).origin
    } catch {
      expectedOriginRef.current = typeof window !== 'undefined' ? window.location.origin : ''
    }
  }, [])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (expectedOriginRef.current && event.origin !== expectedOriginRef.current) return
      const data = event.data as NeonomicsConsentMessage | undefined
      if (!data || data.type !== 'neonomics-consent-ok') return
      setOverlayOpen(false)
      setNavigateMode(false)
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
      popupRef.current = null
      onConsentComplete?.(data)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onConsentComplete])

  const openConsent = useCallback((bankAuthUrl: string, bankDisplayName: string) => {
    setConsentBankName(bankDisplayName)
    const { mode, popup } = openBankConsentUrl(bankAuthUrl)
    popupRef.current = popup
    if (mode === 'navigate') {
      setNavigateMode(true)
      setOverlayOpen(false)
      return
    }
    setNavigateMode(false)
    setOverlayOpen(true)
  }, [])

  return (
    <>
      {children(openConsent)}
      {overlayOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center min-w-0"
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            padding:
              'max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="neonomics-consent-overlay-title"
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2
              id="neonomics-consent-overlay-title"
              className="text-lg font-semibold m-0"
              style={{ color: 'var(--text)' }}
            >
              Fullfør hos {consentBankName}
            </h2>
            <p className="text-sm m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Du logger inn og gir samtykke i bankens vindu. Dottir lagrer ikke passordet ditt. Lukk ikke
              denne siden før du er ferdig.
            </p>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              onClick={() => {
                setOverlayOpen(false)
                if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
                popupRef.current = null
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
      {navigateMode && (
        <p className="text-sm m-0 rounded-xl p-3" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
          Du sendes til {consentBankName} for å logge inn …
        </p>
      )}
    </>
  )
}
