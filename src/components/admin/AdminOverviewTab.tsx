'use client'

import AdminDailyKpiGrid from '@/components/admin/AdminDailyKpiGrid'
import AdminFunnelSection from '@/components/admin/AdminFunnelSection'
import AdminMetricsContextBanner from '@/components/admin/AdminMetricsContextBanner'
import AdminPulseSection from '@/components/admin/AdminPulseSection'
import AdminSubscribersSection from '@/components/admin/AdminSubscribersSection'
import AdminSubscriptionSection from '@/components/admin/AdminSubscriptionSection'
import { adminPanelId, adminTabButtonId } from '@/components/admin/AdminTabNav'
import type { AdminMetricsPayload } from '@/lib/admin/types'

export default function AdminOverviewTab({ metrics }: { metrics: AdminMetricsPayload }) {
  return (
    <div
      role="tabpanel"
      id={adminPanelId('oversikt')}
      aria-labelledby={adminTabButtonId('oversikt')}
      className="min-w-0 space-y-10 sm:space-y-12"
    >
      <AdminMetricsContextBanner variant="oversikt" />
      <AdminPulseSection pulse={metrics.pulse} />
      <AdminSubscriptionSection
        subscription={metrics.subscription}
        trialPotentialMrr={metrics.trialPotentialMrr}
        activeMrr={metrics.activeMrr}
      />
      <AdminSubscribersSection subscribers={metrics.subscribers} />
      <AdminFunnelSection funnel={metrics.funnel} />
      <section className="min-w-0 space-y-4 sm:space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">Siste 30 dager</h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Oppsummert — se Grafer for detaljer og tabell
          </p>
        </div>
        <AdminDailyKpiGrid daily={metrics.daily} dailyTotals={metrics.dailyTotals} />
      </section>
    </div>
  )
}
