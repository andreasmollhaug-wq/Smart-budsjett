'use client'

import AdminMetricPanel from '@/components/admin/AdminMetricPanel'
import type { AdminMetricsPayload } from '@/lib/admin/types'
import { ChevronRight } from 'lucide-react'

function pctLabel(value: number | null): string {
  if (value === null) return '—'
  return `${value} %`
}

function FunnelStep({
  label,
  count,
  pctSub,
}: {
  label: string
  count: number
  pctSub?: string
}) {
  return (
    <div
      className="min-w-0 flex-1 rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--text) 3%, transparent)',
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{count}</p>
      {pctSub ? (
        <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          {pctSub}
        </p>
      ) : null}
    </div>
  )
}

export default function AdminFunnelSection({ funnel }: { funnel: AdminMetricsPayload['funnel'] }) {
  const { conversion } = funnel

  return (
    <section className="min-w-0">
      <AdminMetricPanel
        title="Konvertering"
        subtitle="Totalt siden oppstart · registrert → bekreftet → checkout"
        accent="#7048E8"
      >
        <div className="flex min-w-0 flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          <FunnelStep label="Registrert" count={funnel.registered} />
          <ChevronRight
            className="mx-auto hidden shrink-0 lg:block"
            size={20}
            style={{ color: 'var(--text-muted)' }}
            aria-hidden
          />
          <FunnelStep
            label="E-post bekreftet"
            count={funnel.emailConfirmed}
            pctSub={`${pctLabel(conversion.confirmedPctOfRegistered)} av registrerte`}
          />
          <ChevronRight
            className="mx-auto hidden shrink-0 lg:block"
            size={20}
            style={{ color: 'var(--text-muted)' }}
            aria-hidden
          />
          <FunnelStep
            label="Checkout fullført"
            count={funnel.checkoutCompleted}
            pctSub={`${pctLabel(conversion.checkoutPctOfConfirmed)} av bekreftede · ${pctLabel(conversion.checkoutPctOfRegistered)} av registrerte`}
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Checkout = fullført Stripe Checkout (inkluderer brukere som senere har kansellert).
        </p>
      </AdminMetricPanel>
    </section>
  )
}
