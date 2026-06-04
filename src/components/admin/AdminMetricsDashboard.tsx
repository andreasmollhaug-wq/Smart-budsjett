'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminChartsTab from '@/components/admin/AdminChartsTab'
import AdminMetricsHeader from '@/components/admin/AdminMetricsHeader'
import AdminOverviewTab from '@/components/admin/AdminOverviewTab'
import AdminTabNav from '@/components/admin/AdminTabNav'
import AdminToolsTab from '@/components/admin/AdminToolsTab'
import AdminWelcomeHero from '@/components/admin/AdminWelcomeHero'
import { formatOsloDateTime } from '@/lib/admin/adminMetricsTime'
import { parseAdminTabParam, type AdminTabId } from '@/lib/admin/adminTabs'
import type { AdminMetricsPayload } from '@/lib/admin/types'

function MetricsSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
      <div className="h-40 rounded-2xl" style={{ background: 'var(--surface)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  )
}

const TAB_TITLES: Record<AdminTabId, string> = {
  oversikt: 'Oversikt',
  grafer: 'Grafer',
  verktoy: 'Verktøy',
}

export default function AdminMetricsDashboard({ greetingName }: { greetingName?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseAdminTabParam(searchParams.get('tab'))

  const [metrics, setMetrics] = useState<AdminMetricsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const metricsRef = useRef<AdminMetricsPayload | null>(null)
  metricsRef.current = metrics

  const load = useCallback(async () => {
    const isRefresh = metricsRef.current !== null
    if (isRefresh) setRefreshing(true)
    else setInitialLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/metrics', { cache: 'no-store' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Kunne ikke hente data (${res.status})`)
      }
      const data = (await res.json()) as AdminMetricsPayload
      setMetrics(data)
    } catch (e) {
      if (!isRefresh) setMetrics(null)
      setError(e instanceof Error ? e.message : 'Ukjent feil')
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    document.title = `Admin · ${TAB_TITLES[activeTab]}`
  }, [activeTab])

  const onTabChange = useCallback(
    (tab: AdminTabId) => {
      router.replace(`/admin?tab=${tab}`, { scroll: false })
    },
    [router],
  )

  const updatedLabel = metrics
    ? formatOsloDateTime(Date.parse(metrics.generatedAt))
    : undefined

  return (
    <>
      <AdminMetricsHeader
        updatedLabel={updatedLabel}
        onRefresh={() => void load()}
        refreshing={refreshing}
      />
      <main className="mx-auto max-w-6xl min-w-0 px-[max(1rem,env(safe-area-inset-left))] py-6 sm:px-[max(1.5rem,env(safe-area-inset-left))] sm:py-8">
        <AdminWelcomeHero greetingName={greetingName} />
        <div className="mt-6 sm:mt-8">
          <AdminTabNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
        <div className="mt-6 sm:mt-8">
          {initialLoading ? <MetricsSkeleton /> : null}
          {!initialLoading && error && !metrics ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: '#991b1b' }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm font-medium touch-manipulation"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Prøv igjen
              </button>
            </div>
          ) : null}
          {!initialLoading && error && metrics ? (
            <p
              className="mb-4 rounded-xl px-3 py-2 text-sm"
              style={{ background: 'color-mix(in srgb, #991b1b 8%, var(--surface))', color: '#991b1b' }}
              role="status"
            >
              Kunne ikke oppdatere: {error}
            </p>
          ) : null}
          {metrics ? (
            <div className="pb-8">
              {activeTab === 'oversikt' ? <AdminOverviewTab metrics={metrics} /> : null}
              {activeTab === 'grafer' ? <AdminChartsTab metrics={metrics} /> : null}
              {activeTab === 'verktoy' ? <AdminToolsTab onReload={load} /> : null}
            </div>
          ) : null}
        </div>
      </main>
    </>
  )
}
