'use client'

import { formatAdminNok } from '@/lib/admin/adminPlanMrr'
import type { AdminPlanMrrBreakdown } from '@/lib/admin/types'
import type { LucideIcon } from 'lucide-react'

function MrrColumn({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="min-w-0 flex-1 text-center sm:text-left">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide sm:text-xs" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight sm:text-2xl" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      <p className="mt-0.5 text-xs leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </div>
  )
}

export default function AdminPlanMrrCard({
  title,
  description,
  emptyDescription,
  mrr,
  countNoun,
  icon: Icon,
  iconColor,
  period = 'month',
}: {
  title: string
  description: string
  emptyDescription: string
  mrr: AdminPlanMrrBreakdown
  /** f.eks. «i prøve» eller «aktive» */
  countNoun: string
  icon: LucideIcon
  iconColor: string
  period?: 'month' | 'year'
}) {
  const periodSuffix = period === 'year' ? '/år' : '/mnd'
  const knownCount = mrr.solo.count + mrr.family.count
  const hasAny = knownCount + mrr.unknownPlanCount > 0

  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-5"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--text) 3%, transparent)',
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className="mt-0.5 text-[0.65rem] leading-relaxed sm:text-xs" style={{ color: 'var(--text-muted)' }}>
            {hasAny ? description : emptyDescription}
          </p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${iconColor}18`, color: iconColor }}
        >
          <Icon size={18} strokeWidth={2.2} aria-hidden />
        </div>
      </div>

      <div
        className="mt-4 grid min-w-0 grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3 sm:gap-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <MrrColumn
          label="Totalt"
          value={formatAdminNok(mrr.totalNok)}
          sub={
            mrr.unknownPlanCount > 0
              ? `${knownCount} med kjent plan`
              : `${knownCount} ${countNoun}`
          }
          accent="#099268"
        />
        <MrrColumn
          label="Solo"
          value={formatAdminNok(mrr.solo.mrrNok)}
          sub={`${mrr.solo.count} × ${mrr.solo.priceNok} kr${periodSuffix}`}
          accent="#3B5BDB"
        />
        <MrrColumn
          label="Familie"
          value={formatAdminNok(mrr.family.mrrNok)}
          sub={`${mrr.family.count} × ${mrr.family.priceNok} kr${periodSuffix}`}
          accent="#7048E8"
        />
      </div>

      {mrr.unknownPlanCount > 0 ? (
        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          + {mrr.unknownPlanCount} {countNoun} uten kjent plan (ikke med i total).
        </p>
      ) : null}
    </div>
  )
}
