'use client'

import AdminMetricPanel from '@/components/admin/AdminMetricPanel'
import StatCard from '@/components/ui/StatCard'
import { formatPulseDelta } from '@/lib/admin/buildAdminMetrics'
import type { AdminMetricsPayload } from '@/lib/admin/types'
import { CreditCard, MailCheck, UserPlus } from 'lucide-react'

function PulseCard({
  label,
  value,
  sub,
  trend,
  icon,
  color,
  info,
}: {
  label: string
  value: number
  sub: string
  trend?: 'up' | 'down'
  icon: React.ElementType
  color: string
  info: string
}) {
  return (
    <StatCard
      label={label}
      value={String(value)}
      sub={sub}
      trend={trend}
      icon={icon}
      color={color}
      info={info}
      variant="inset"
    />
  )
}

function PulseMetricRow({
  title,
  subtitle,
  registrations,
  confirmed,
  checkouts,
  compareLabel,
}: {
  title: string
  subtitle: string
  registrations: { value: number; compare: number }
  confirmed: { value: number; compare: number }
  checkouts: { value: number; compare: number }
  compareLabel: string
}) {
  const regDelta = formatPulseDelta(registrations.value, registrations.compare, compareLabel)
  const confDelta = formatPulseDelta(confirmed.value, confirmed.compare, compareLabel)
  const chkDelta = formatPulseDelta(checkouts.value, checkouts.compare, compareLabel)

  return (
    <AdminMetricPanel title={title} subtitle={subtitle}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <PulseCard
          label="Nye registreringer"
          value={registrations.value}
          sub={regDelta.sub}
          trend={regDelta.trend}
          icon={UserPlus}
          color="#3B5BDB"
          info={`Antall nye kontoer — ${title.toLowerCase()}.`}
        />
        <PulseCard
          label="Nye bekreftede"
          value={confirmed.value}
          sub={confDelta.sub}
          trend={confDelta.trend}
          icon={MailCheck}
          color="#099268"
          info={`Antall e-post bekreftet — ${title.toLowerCase()}.`}
        />
        <PulseCard
          label="Nye checkout"
          value={checkouts.value}
          sub={chkDelta.sub}
          trend={chkDelta.trend}
          icon={CreditCard}
          color="#7048E8"
          info={`Antall fullførte Stripe Checkout — ${title.toLowerCase()}.`}
        />
      </div>
    </AdminMetricPanel>
  )
}

export default function AdminPulseSection({ pulse }: { pulse: AdminMetricsPayload['pulse'] }) {
  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      <PulseMetricRow
        title="I dag"
        subtitle={`${pulse.todayLabel} hittil · sammenlignet med hele gårsdagen`}
        registrations={{ value: pulse.registrations.today, compare: pulse.registrations.yesterday }}
        confirmed={{ value: pulse.confirmed.today, compare: pulse.confirmed.yesterday }}
        checkouts={{ value: pulse.checkouts.today, compare: pulse.checkouts.yesterday }}
        compareLabel="hele gårsdagen"
      />
      <PulseMetricRow
        title="I går"
        subtitle={`${pulse.yesterdayLabel} · sammenlignet med dagen før`}
        registrations={{
          value: pulse.registrations.yesterday,
          compare: pulse.registrations.priorDay,
        }}
        confirmed={{ value: pulse.confirmed.yesterday, compare: pulse.confirmed.priorDay }}
        checkouts={{ value: pulse.checkouts.yesterday, compare: pulse.checkouts.priorDay }}
        compareLabel="dagen før"
      />
    </section>
  )
}
