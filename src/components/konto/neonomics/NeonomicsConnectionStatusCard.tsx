'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import BankAccountsOverview from '@/components/konto/neonomics/BankAccountsOverview'
import BankAccountsSelector from '@/components/konto/neonomics/BankAccountsSelector'
import BankConnectionCard from '@/components/konto/neonomics/BankConnectionCard'
import type { NeonomicsConnectionStatusDto } from '@/lib/neonomics/connectionStatus'
import { BANK_CONNECT_SECTION_TITLE } from '@/lib/neonomics/bankConnectCopy'
import type { Transaction } from '@/lib/store'
import { useStore } from '@/lib/store'

type Props = {
  profileId: string
  refreshKey?: number
  busy?: boolean
  onSyncConnection: (conn: NeonomicsConnectionStatusDto) => void
  onDisconnectConnection: (conn: NeonomicsConnectionStatusDto) => void
  onConnectionsLoaded?: (connections: NeonomicsConnectionStatusDto[]) => void
  transactions?: Transaction[]
  onAccountsChanged?: () => void
}

export default function NeonomicsConnectionStatusCard({
  profileId,
  refreshKey = 0,
  busy,
  onSyncConnection,
  onDisconnectConnection,
  onConnectionsLoaded,
  transactions = [],
  onAccountsChanged,
}: Props) {
  const setBankConnectionsForProfile = useStore((s) => s.setBankConnectionsForProfile)
  const [connections, setConnections] = useState<NeonomicsConnectionStatusDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(
        `/api/bank/neonomics/status?profileId=${encodeURIComponent(profileId)}`,
      )
      const data = (await res.json().catch(() => null)) as {
        connections?: NeonomicsConnectionStatusDto[]
        error?: string
      }
      if (!res.ok) {
        setLoadError(data?.error ?? 'Kunne ikke hente status.')
        setConnections([])
        return
      }
      const list = data.connections ?? []
      setConnections(list)
      setBankConnectionsForProfile(profileId, list)
      onConnectionsLoaded?.(list)
    } finally {
      setLoading(false)
    }
  }, [profileId, setBankConnectionsForProfile, onConnectionsLoaded])

  useEffect(() => {
    void refresh()
  }, [refresh, refreshKey])

  const allReady =
    !loading && !loadError && connections.length > 0 && connections.every((c) => c.consentOk)

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
          {BANK_CONNECT_SECTION_TITLE}
        </h2>
        {allReady && (
          <CheckCircle2
            size={18}
            className="shrink-0 opacity-90"
            style={{ color: 'var(--success)' }}
            aria-label="Alle koblinger har gyldig samtykke"
          />
        )}
      </div>

      {loadError && (
        <p className="text-sm m-0" style={{ color: '#991b1b' }} role="alert">
          {loadError}
        </p>
      )}

      {loading && !loadError && (
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Henter status…
        </p>
      )}

      {!loading && !loadError && connections.length === 0 && (
        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Ingen bank koblet ennå.
        </p>
      )}

      {connections.map((conn) => (
        <div key={conn.id} className="space-y-3 min-w-0">
          <BankConnectionCard
            connection={conn}
            disabled={busy}
            onSync={() => onSyncConnection(conn)}
            onDisconnect={() => onDisconnectConnection(conn)}
            onAutoSyncChange={(enabled) => {
              setConnections((prev) =>
                prev.map((c) => (c.id === conn.id ? { ...c, autoSyncEnabled: enabled } : c)),
              )
              void refresh()
            }}
          />
          {conn.consentOk && (
            <>
              <BankAccountsSelector
                connection={conn}
                disabled={busy}
                onSaved={() => {
                  void refresh()
                  onAccountsChanged?.()
                }}
              />
              <BankAccountsOverview connection={conn} transactions={transactions} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
