'use client'

import { useMemo } from 'react'
import { CreditCard, MailCheck, TrendingUp, UserPlus } from 'lucide-react'
import { computeDailyDerived } from '@/lib/admin/adminDailyDisplay'
import type { AdminMetricsPayload } from '@/lib/admin/types'

function MiniKpi({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 2px color-mix(in srgb, var(--text) 4%, transparent)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon size={18} strokeWidth={2.2} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </div>
  )
}

export default function AdminDailyKpiGrid({
  daily,
  dailyTotals,
}: {
  daily: AdminMetricsPayload['daily']
  dailyTotals: AdminMetricsPayload['dailyTotals']
}) {
  const derived = useMemo(() => computeDailyDerived(daily, dailyTotals), [daily, dailyTotals])

  if (daily.length === 0) return null

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <MiniKpi
        label="Registrert (30 d)"
        value={String(dailyTotals.registrations)}
        sub={`Ø ${derived.avgReg} / dag · beste: ${derived.bestRegDay.registrations} (${derived.bestRegDay.dayLabel})`}
        icon={UserPlus}
        accent="#3B5BDB"
      />
      <MiniKpi
        label="Bekreftet (30 d)"
        value={String(dailyTotals.confirmed)}
        sub={`Ø ${derived.avgConfirmed} / dag · ${derived.confirmRate} av registrert`}
        icon={MailCheck}
        accent="#099268"
      />
      <MiniKpi
        label="Checkout (30 d)"
        value={String(dailyTotals.checkouts)}
        sub={`Ø ${derived.avgCheckout} / dag · ${derived.checkoutRate} av bekreftet`}
        icon={CreditCard}
        accent="#7048E8"
      />
      <MiniKpi
        label="Siste 7 dager"
        value={`${derived.last7Reg} / ${derived.last7Checkout}`}
        sub="Registrert / checkout"
        icon={TrendingUp}
        accent="#E67700"
      />
    </div>
  )
}
