'use client'

import { useCallback, useEffect, useState } from 'react'
import type { NeonomicsBankCatalogDto } from '@/lib/neonomics/bankCatalogTypes'
import {
  BANK_CONNECT_BTN_CONNECTING,
  BANK_CONNECT_ERROR_CONNECT,
  BANK_CONNECT_PANEL_INGRESS,
  BANK_CONNECT_PANEL_TITLE,
  bankConnectButtonLabel,
  mapBankConnectError,
} from '@/lib/neonomics/bankConnectCopy'

type Props = {
  profileId: string
  connectedBankIds: string[]
  openConsent: (url: string, bankDisplayName: string) => void
  onError: (message: string | null) => void
  onConnectionChange?: () => void
}

export default function NeonomicsBankImportPanel({
  profileId,
  connectedBankIds,
  openConsent,
  onError,
  onConnectionChange,
}: Props) {
  const [banks, setBanks] = useState<NeonomicsBankCatalogDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyBankId, setBusyBankId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoadError(null)
      try {
        const res = await fetch(
          `/api/bank/neonomics/banks?profileId=${encodeURIComponent(profileId)}`,
        )
        const data = (await res.json().catch(() => null)) as {
          banks?: NeonomicsBankCatalogDto[]
          error?: string
        }
        if (!res.ok) {
          if (!cancelled) setLoadError(data?.error ?? 'Kunne ikke hente bankliste.')
          return
        }
        if (!cancelled) setBanks(data?.banks ?? [])
      } catch {
        if (!cancelled) setLoadError('Kunne ikke hente bankliste.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profileId])

  const connect = useCallback(
    async (bank: NeonomicsBankCatalogDto) => {
      setBusyBankId(bank.bankId)
      onError(null)
      setMessage(null)
      try {
        const res = await fetch('/api/bank/neonomics/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId, bankId: bank.bankId }),
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
          openConsent(data.bankAuthUrl, bank.displayName)
          return
        }
        onConnectionChange?.()
        setMessage(`${bank.displayName} er koblet.`)
      } finally {
        setBusyBankId(null)
      }
    },
    [profileId, onError, onConnectionChange, openConsent],
  )

  const available = banks.filter((b) => !connectedBankIds.includes(b.bankId))
  if (available.length === 0 && !loadError) return null

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

      {loadError && (
        <p className="text-sm m-0 rounded-xl p-3" style={{ background: '#fef2f2', color: '#991b1b' }}>
          {loadError}
        </p>
      )}

      {message && (
        <p
          className="text-sm rounded-xl p-3 m-0"
          style={{ background: 'var(--surface-muted)', color: 'var(--text)' }}
        >
          {message}
        </p>
      )}

      <ul className="list-none m-0 p-0 space-y-2 min-w-0">
        {available.map((bank) => {
          const busy = busyBankId === bank.bankId
          return (
            <li
              key={bank.bankId}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-3 min-w-0"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {bank.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bank.logoUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-lg object-contain"
                  />
                ) : null}
                <div className="min-w-0">
                  <span className="text-sm font-medium truncate block" style={{ color: 'var(--text)' }}>
                    {bank.displayName}
                  </span>
                  {bank.bankingGroupName && bank.bankingGroupName !== bank.displayName ? (
                    <span className="text-xs truncate block" style={{ color: 'var(--text-muted)' }}>
                      {bank.bankingGroupName}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                disabled={busy || busyBankId != null}
                onClick={() => void connect(bank)}
                className="min-h-[44px] w-full sm:w-auto shrink-0 rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                {busy ? BANK_CONNECT_BTN_CONNECTING : bankConnectButtonLabel(bank.displayName)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
