'use client'

import AdminDailyChart from '@/components/admin/AdminDailyChart'
import AdminDailyKpiGrid from '@/components/admin/AdminDailyKpiGrid'
import AdminDailyTable from '@/components/admin/AdminDailyTable'
import AdminMetricPanel from '@/components/admin/AdminMetricPanel'
import AdminMetricsContextBanner from '@/components/admin/AdminMetricsContextBanner'
import AdminWeeklyChart from '@/components/admin/AdminWeeklyChart'
import { adminPanelId, adminTabButtonId } from '@/components/admin/AdminTabNav'
import type { AdminMetricsPayload } from '@/lib/admin/types'

export default function AdminChartsTab({ metrics }: { metrics: AdminMetricsPayload }) {
  return (
    <div
      role="tabpanel"
      id={adminPanelId('grafer')}
      aria-labelledby={adminTabButtonId('grafer')}
      className="min-w-0 space-y-8 sm:space-y-10"
    >
      <AdminMetricsContextBanner variant="grafer" />
      <AdminDailyKpiGrid daily={metrics.daily} dailyTotals={metrics.dailyTotals} />
      <AdminMetricPanel
        title="Daglig utvikling"
        subtitle="Siste 30 dager (Europe/Oslo) · i dag hittil"
      >
        <AdminDailyChart daily={metrics.daily} />
      </AdminMetricPanel>
      <AdminMetricPanel
        title="Ukentlig utvikling"
        subtitle="Siste 12 uker (mandag–søndag) · registreringer, bekreftet e-post og checkout"
      >
        <AdminWeeklyChart weekly={metrics.weekly} />
      </AdminMetricPanel>
      <details className="min-w-0 lg:hidden">
        <summary
          className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-medium touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          Vis dagtabell
        </summary>
        <div className="mt-4">
          <AdminDailyTable daily={metrics.daily} dailyTotals={metrics.dailyTotals} />
        </div>
      </details>
      <section className="hidden min-w-0 lg:block">
        <h3 className="mb-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Dagtabell
        </h3>
        <AdminDailyTable daily={metrics.daily} dailyTotals={metrics.dailyTotals} />
      </section>
    </div>
  )
}
