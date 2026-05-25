'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { NeonomicsConnectionStatusDto } from '@/lib/neonomics/connectionStatus'
import {
  BANK_CONNECT_AUTO_SYNC_HINT,
  BANK_CONNECT_AUTO_SYNC_LABEL,
  BANK_CONNECT_BTN_DISCONNECT,
  BANK_CONNECT_BTN_FETCH,
} from '@/lib/neonomics/bankConnectCopy'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'

function formatLastSync(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return formatIsoDateDdMmYyyy(iso.slice(0, 10))
  const date = formatIsoDateDdMmYyyy(iso.slice(0, 10))
  const time = d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  return `${date} kl. ${time}`
}

type Props = {
  connection: NeonomicsConnectionStatusDto
  disabled?: boolean
  onSync: () => void
  onDisconnect: () => void
  onAutoSyncChange: (enabled: boolean) => void
}

export default function BankConnectionCard({
  connection,
  disabled,
  onSync,
  onDisconnect,
  onAutoSyncChange,
}: Props) {
  const [toggleBusy, setToggleBusy] = useState(false)
  const ready = connection.consentOk

  const patchAuto = async (enabled: boolean) => {
    setToggleBusy(true)
    try {
      const res = await fetch(`/api/bank/neonomics/connections/${connection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSyncEnabled: enabled }),
      })
      if (res.ok) {
        const data = (await res.json()) as NeonomicsConnectionStatusDto
        onAutoSyncChange(data.autoSyncEnabled)
      }
    } finally {
      setToggleBusy(false)
    }
  }

  return (
    <article
      className="rounded-2xl border p-4 sm:p-5 space-y-3 min-w-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
          {connection.bankDisplayName}
        </h3>
        {ready && (
          <CheckCircle2
            size={18}
            className="shrink-0 opacity-90"
            style={{ color: 'var(--success)' }}
            aria-label="Kobling og samtykke er OK"
          />
        )}
      </div>

      <dl className="text-sm m-0 space-y-2 min-w-0">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="m-0 shrink-0" style={{ color: 'var(--text-muted)' }}>
            Samtykke
          </dt>
          <dd className="m-0" style={{ color: 'var(--text)' }}>
            {connection.consentOk ? 'OK' : 'Trenger oppdatering i bank'}
          </dd>
        </div>
        {connection.syncAccountIds.length > 0 && (
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="m-0 shrink-0" style={{ color: 'var(--text-muted)' }}>
              Kontoer
            </dt>
            <dd className="m-0" style={{ color: 'var(--text)' }}>
              {connection.syncAccountIds.length} valgt for henting
            </dd>
          </div>
        )}
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="m-0 shrink-0" style={{ color: 'var(--text-muted)' }}>
            Sist hentet
          </dt>
          <dd className="m-0 min-w-0" style={{ color: 'var(--text)' }}>
            {connection.lastSyncAt ? (
              <>
                {formatLastSync(connection.lastSyncAt)}
                {connection.lastSyncFetchedCount != null && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {' '}
                    ({connection.lastSyncFetchedCount} fra bank)
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Ikke hentet ennå</span>
            )}
          </dd>
        </div>
        {connection.pendingUnmappedCount > 0 && (
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <dt className="m-0 shrink-0" style={{ color: 'var(--text-muted)' }}>
              Venter kartlegging
            </dt>
            <dd className="m-0" style={{ color: 'var(--text)' }}>
              {connection.pendingUnmappedCount}
            </dd>
          </div>
        )}
      </dl>

      {connection.lastSyncError && (
        <p className="text-xs m-0 rounded-xl p-3" style={{ background: '#fffbeb', color: '#92400e' }}>
          Siste henting feilet: {connection.lastSyncError}
        </p>
      )}

      <label className="flex items-start gap-3 min-h-[44px] py-1 cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 mt-0.5"
          checked={connection.autoSyncEnabled}
          disabled={disabled || toggleBusy || !connection.consentOk}
          onChange={(e) => void patchAuto(e.target.checked)}
        />
        <span className="text-sm leading-snug min-w-0" style={{ color: 'var(--text)' }}>
          <span className="font-medium">{BANK_CONNECT_AUTO_SYNC_LABEL}</span>
          <span className="block mt-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
            {BANK_CONNECT_AUTO_SYNC_HINT}
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={disabled || !connection.consentOk}
          onClick={onSync}
          className="min-h-[44px] w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium touch-manipulation disabled:opacity-60"
          style={{
            background: 'var(--primary-pale)',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
          }}
        >
          {BANK_CONNECT_BTN_FETCH}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDisconnect}
          className="min-h-[44px] w-full sm:w-auto rounded-xl px-4 py-3 text-sm font-medium touch-manipulation disabled:opacity-60"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: 'var(--danger)',
          }}
        >
          {BANK_CONNECT_BTN_DISCONNECT}
        </button>
      </div>
    </article>
  )
}
