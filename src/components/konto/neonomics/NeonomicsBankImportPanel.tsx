'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BANK_CONNECT_BTN_CONNECT,
  BANK_CONNECT_BTN_CONNECTING,
  BANK_CONNECT_ERROR_CONNECT,
  BANK_CONNECT_PANEL_INGRESS,
  BANK_CONNECT_PANEL_TITLE,
  mapBankConnectError,
} from '@/lib/neonomics/bankConnectCopy'

type Props = {
  profileId: string
  hasConnections: boolean
  openConsent: (url: string) => void
  onError: (message: string | null) => void
  onConnectionChange?: () => void
}

export default function NeonomicsBankImportPanel({
  profileId,
  hasConnections,
  openConsent,
  onError,
  onConnectionChange,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setBusy(true)
    onError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/bank/neonomics/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })
      const data = (await res.json().catch(() => null)) as {
        needsConsent?: boolean
        bankAuthUrl?: string
        error?: string
      }
      if (!res.ok) {
        const msg = mapBankConnectError(res.status, data) || BANK_CONNECT_ERROR_CONNECT
        setMessage(msg)
        onError(msg)
        return
      }
      if (data.needsConsent && data.bankAuthUrl) {
        openConsent(data.bankAuthUrl)
        return
      }
      onConnectionChange?.()
      setMessage('Bank koblet.')
    } finally {
      setBusy(false)
    }
  }, [profileId, onError, onConnectionChange, openConsent])

  useEffect(() => {
    if (!hasConnections) setMessage(null)
  }, [hasConnections])

  if (hasConnections) return null

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 space-y-4 min-w-0"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div>
        <h2 className="font-semibold text-base m-0" style={{ color: 'var(--text)' }}>
          {BANK_CONNECT_PANEL_TITLE}
        </h2>
        <p className="text-sm mt-1 mb-0" style={{ color: 'var(--text-muted)' }}>
          {BANK_CONNECT_PANEL_INGRESS}
        </p>
      </div>

      {message && (
        <p
          className="text-sm rounded-xl p-3 m-0"
          style={{ background: 'var(--surface-muted)', color: 'var(--text)' }}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => void connect()}
        className="min-h-[44px] w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation disabled:opacity-60"
        style={{ background: 'var(--primary)' }}
      >
        {busy ? BANK_CONNECT_BTN_CONNECTING : BANK_CONNECT_BTN_CONNECT}
      </button>
    </div>
  )
}
