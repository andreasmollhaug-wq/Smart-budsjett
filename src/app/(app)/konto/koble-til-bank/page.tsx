'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import BankImportHistoryList from '@/components/konto/BankImportHistoryList'
import BankConnectHelpPopover from '@/components/konto/neonomics/BankConnectHelpPopover'
import NeonomicsBankImportPanel from '@/components/konto/neonomics/NeonomicsBankImportPanel'
import NeonomicsConnectionStatusCard from '@/components/konto/neonomics/NeonomicsConnectionStatusCard'
import NeonomicsConsentLauncher from '@/components/konto/neonomics/NeonomicsConsentLauncher'
import type { NeonomicsConnectionStatusDto } from '@/lib/neonomics/connectionStatus'
import type { BankSourceId } from '@/lib/bankImport/types'
import {
  BANK_CONNECT_ERROR_CALLBACK,
  BANK_CONNECT_ERROR_FETCH,
  BANK_CONNECT_HISTORY_EMPTY,
  BANK_CONNECT_HISTORY_HINT,
  BANK_CONNECT_HISTORY_TITLE,
  BANK_CONNECT_PAGE_INGRESS,
  BANK_CONNECT_POST_CONNECT_DISMISS,
  BANK_CONNECT_POST_CONNECT_HINT,
  BANK_CONNECT_TOAST_CONNECTED_BODY,
  BANK_CONNECT_TOAST_CONNECTED_TITLE,
  formatBankSyncToastBody,
  mapBankConnectError,
} from '@/lib/neonomics/bankConnectCopy'
import { isNeonomicsPublicEnabled } from '@/lib/neonomics/feature'
import { useStore } from '@/lib/store'

const NEONOMICS_SOURCE_IDS: BankSourceId[] = ['neonomics_dnb', 'neonomics_nordea']

export default function KobleTilBankPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profiles = useStore((s) => s.profiles)
  const people = useStore((s) => s.people)
  const bankImportHistory = useStore((s) => s.bankImportHistory)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const setActiveProfileId = useStore((s) => s.setActiveProfileId)
  const addAppNotification = useStore((s) => s.addAppNotification)

  const [profileId, setProfileId] = useState(activeProfileId)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [statusRefreshKey, setStatusRefreshKey] = useState(0)
  const [connectionCount, setConnectionCount] = useState(0)
  const [connections, setConnections] = useState<NeonomicsConnectionStatusDto[]>([])
  const [syncBusy, setSyncBusy] = useState(false)
  const [showPostConnectHint, setShowPostConnectHint] = useState(false)

  useEffect(() => {
    setProfileId(activeProfileId)
  }, [activeProfileId])

  useEffect(() => {
    if (connections.some((c) => c.lastSyncAt)) {
      setShowPostConnectHint(false)
    }
  }, [connections])

  useEffect(() => {
    const flag = searchParams.get('neonomics')
    if (!flag) return
    const pid = searchParams.get('profileId')
    if (pid && profiles.some((p) => p.id === pid)) {
      setProfileId(pid)
      setActiveProfileId(pid)
    }
    if (flag === 'connected') {
      setShowPostConnectHint(true)
      addAppNotification({
        title: BANK_CONNECT_TOAST_CONNECTED_TITLE,
        body: BANK_CONNECT_TOAST_CONNECTED_BODY,
        kind: 'budget',
      })
      setStatusRefreshKey((k) => k + 1)
      void router.refresh()
    } else if (flag === 'error') {
      setConnectError(BANK_CONNECT_ERROR_CALLBACK)
    }
    window.history.replaceState(null, '', '/konto/koble-til-bank')
  }, [searchParams, profiles, setActiveProfileId, addAppNotification, router])

  const person = people[profileId]

  const neonomicsRuns = useMemo(
    () =>
      bankImportHistory
        .filter(
          (r) =>
            NEONOMICS_SOURCE_IDS.includes(r.sourceId) && r.profileId === profileId,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bankImportHistory, profileId],
  )

  const bumpStatusRefresh = useCallback(() => {
    setStatusRefreshKey((k) => k + 1)
    void router.refresh()
  }, [router])

  const runSync = useCallback(
    async (conn: NeonomicsConnectionStatusDto, openConsent: (url: string) => void) => {
      setSyncBusy(true)
      setConnectError(null)
      try {
        const res = await fetch('/api/bank/neonomics/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId, bankId: conn.bankId }),
        })
        const data = (await res.json().catch(() => null)) as {
          needsConsent?: boolean
          bankAuthUrl?: string
          meta?: {
            fetchedCount: number
            importedCount: number
            pendingCount: number
            duplicateCount: number
            accounts?: Array<{
              accountId: string
              label: string
              fetched: number
              imported: number
              pending: number
              duplicate: number
            }>
          }
          error?: string
        }
        if (!res.ok) {
          setConnectError(mapBankConnectError(res.status, data) || BANK_CONNECT_ERROR_FETCH)
          return
        }
        if (data.needsConsent && data.bankAuthUrl) {
          openConsent(data.bankAuthUrl)
          return
        }
        setShowPostConnectHint(false)
        await router.refresh()
        setStatusRefreshKey((k) => k + 1)
        const pending = data.meta?.pendingCount ?? 0
        const imported = data.meta?.importedCount ?? 0
        if (pending > 0) {
          addAppNotification({
            title: 'Transaksjoner trenger kartlegging',
            body: `${pending} rad${pending === 1 ? '' : 'er'} fra ${conn.bankDisplayName} — kartlegg kategori.`,
            kind: 'budget',
          })
          router.push(
            `/konto/importer-transaksjoner?bankPending=1&profileId=${encodeURIComponent(profileId)}&bankId=${encodeURIComponent(conn.bankId)}`,
          )
        } else {
          const toastBody = formatBankSyncToastBody({
            accounts: data.meta?.accounts,
            importedCount: imported,
            pendingCount: pending,
            duplicateCount: data.meta?.duplicateCount ?? 0,
          })
          addAppNotification({
            title: imported > 0 ? 'Importert fra bank' : 'Ingen nye transaksjoner',
            body: toastBody,
            kind: 'budget',
          })
        }
      } finally {
        setSyncBusy(false)
      }
    },
    [profileId, addAppNotification, router],
  )

  const runDisconnect = useCallback(
    async (conn: NeonomicsConnectionStatusDto) => {
      setSyncBusy(true)
      try {
        await fetch(
          `/api/bank/neonomics/disconnect?connectionId=${encodeURIComponent(conn.id)}`,
          { method: 'DELETE' },
        )
        bumpStatusRefresh()
        addAppNotification({
          title: 'Bank frakoblet',
          body: `${conn.bankDisplayName} er fjernet. Importerte transaksjoner er beholdt.`,
          kind: 'budget',
        })
      } finally {
        setSyncBusy(false)
      }
    },
    [bumpStatusRefresh, addAppNotification],
  )

  const handleProfileChange = (pid: string) => {
    setProfileId(pid)
    setActiveProfileId(pid)
    setStatusRefreshKey((k) => k + 1)
    setShowPostConnectHint(false)
  }

  const handleConnectionsLoaded = useCallback((list: NeonomicsConnectionStatusDto[]) => {
    setConnectionCount(list.length)
    setConnections(list)
  }, [])

  if (!isNeonomicsPublicEnabled()) {
    return (
      <div className="space-y-4 max-w-3xl">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Bankkobling er ikke aktivert i dette miljøet.
        </p>
        <Link href="/konto/innstillinger" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
          Tilbake til Min konto
        </Link>
      </div>
    )
  }

  const isSandbox =
    typeof process.env.NEXT_PUBLIC_NEONOMICS_ENABLED !== 'undefined' &&
    process.env.NEXT_PUBLIC_NEONOMICS_ENABLED === 'true'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/konto/innstillinger"
          className="inline-flex items-center gap-1 font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Min konto
        </Link>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text)' }}>Koble til bank</span>
      </div>

      <NeonomicsConsentLauncher
        bankDisplayName="DNB"
        onConsentComplete={() => {
          setShowPostConnectHint(true)
          bumpStatusRefresh()
          addAppNotification({
            title: BANK_CONNECT_TOAST_CONNECTED_TITLE,
            body: BANK_CONNECT_TOAST_CONNECTED_BODY,
            kind: 'budget',
          })
        }}
      >
        {(openConsent) => (
          <div
            className="rounded-2xl p-6 sm:p-8 space-y-6 min-w-0"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div className="flex flex-wrap items-center gap-1 mb-2 min-w-0">
                <h1 className="text-2xl font-semibold m-0" style={{ color: 'var(--text)' }}>
                  Koble til bank
                </h1>
                {isSandbox && (
                  <span
                    className="text-xs font-medium rounded-lg px-2 py-1"
                    style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
                  >
                    Sandbox
                  </span>
                )}
                <BankConnectHelpPopover
                  showSandboxNote={isSandbox}
                  profileCount={profiles.length}
                />
              </div>
              <p className="text-sm m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {BANK_CONNECT_PAGE_INGRESS}
              </p>
            </div>

            {showPostConnectHint && connectionCount > 0 && (
              <div
                className="rounded-xl p-4 flex flex-row items-start gap-3 min-w-0"
                style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
                role="status"
              >
                <p className="text-sm m-0 leading-relaxed flex-1 min-w-0" style={{ color: 'var(--text)' }}>
                  {BANK_CONNECT_POST_CONNECT_HINT}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPostConnectHint(false)}
                  className="shrink-0 text-sm font-medium min-h-[44px] min-w-[44px] px-2 rounded-lg touch-manipulation"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={BANK_CONNECT_POST_CONNECT_DISMISS}
                >
                  {BANK_CONNECT_POST_CONNECT_DISMISS}
                </button>
              </div>
            )}

            {profiles.length >= 2 && (
              <div
                className="rounded-2xl p-4 min-w-0"
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                }}
              >
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Profil for bankkobling
                </label>
                <select
                  value={profileId}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  className="w-full max-w-md rounded-xl px-3 py-3 sm:py-2 text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
                  style={{ border: '1px solid var(--border)', background: '#fff', color: 'var(--text)' }}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {connectError && (
              <p
                className="text-sm rounded-xl p-3 m-0"
                style={{ background: '#fef2f2', color: '#991b1b' }}
                role="alert"
              >
                {connectError}
              </p>
            )}

            <NeonomicsConnectionStatusCard
              profileId={profileId}
              refreshKey={statusRefreshKey}
              busy={syncBusy}
              transactions={person?.transactions ?? []}
              onConnectionsLoaded={handleConnectionsLoaded}
              onAccountsChanged={() => setStatusRefreshKey((k) => k + 1)}
              onSyncConnection={(conn) => void runSync(conn, openConsent)}
              onDisconnectConnection={(conn) => void runDisconnect(conn)}
            />

            {person && (
              <NeonomicsBankImportPanel
                profileId={profileId}
                hasConnections={connectionCount > 0}
                openConsent={openConsent}
                onError={setConnectError}
                onConnectionChange={() => {
                  bumpStatusRefresh()
                  setStatusRefreshKey((k) => k + 1)
                }}
              />
            )}

            <div className="space-y-3 pt-2 border-t min-w-0" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
                  {BANK_CONNECT_HISTORY_TITLE}
                </h2>
                <p className="text-xs mt-1 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {BANK_CONNECT_HISTORY_HINT}{' '}
                  <Link
                    href="/konto/importer-transaksjoner"
                    className="font-medium underline underline-offset-2"
                    style={{ color: 'var(--primary)' }}
                  >
                    Importer transaksjoner
                  </Link>
                  .
                </p>
              </div>
              <BankImportHistoryList runs={neonomicsRuns} emptyMessage={BANK_CONNECT_HISTORY_EMPTY} />
            </div>
          </div>
        )}
      </NeonomicsConsentLauncher>
    </div>
  )
}
