'use client'

import type { CreditorRegistryOverview } from '@/lib/creditorRegistry/aggregate'

type Props = {
  overview: CreditorRegistryOverview
  formatNOK: (n: number) => string
  /** Tettere 2×2-layout for info-modal og smale containere. */
  compact?: boolean
}

type KpiItem = {
  label: string
  value: string
  valueColor?: string
  hint?: string
}

export default function CreditorRegistryKpiRow({ overview, formatNOK, compact = false }: Props) {
  const cardStyle = {
    background: compact ? 'var(--bg)' : 'var(--surface)',
    border: '1px solid var(--border)',
  } as const

  const items: KpiItem[] = compact
    ? [
        { label: 'Restgjeld', value: formatNOK(overview.totalRemaining), valueColor: 'var(--danger)' },
        { label: 'Kreditorer', value: String(overview.creditorCount) },
        { label: 'Lån', value: String(overview.loanCount) },
        { label: 'Mnd. avdrag', value: formatNOK(overview.totalMonthly) },
      ]
    : [
        { label: 'Total restgjeld', value: formatNOK(overview.totalRemaining), valueColor: 'var(--danger)' },
        { label: 'Antall kreditorer', value: String(overview.creditorCount) },
        { label: 'Antall lån', value: String(overview.loanCount) },
        {
          label: 'Månedlige avdrag',
          value: formatNOK(overview.totalMonthly),
          hint: 'Sum registrerte avdrag per måned',
        },
      ]

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-2 gap-2 min-w-0'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
      }
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={compact ? 'rounded-xl p-3 min-w-0' : 'rounded-2xl p-4 sm:p-5 min-w-0'}
          style={cardStyle}
        >
          <p
            className={compact ? 'text-xs leading-snug m-0' : 'text-sm m-0'}
            style={{ color: 'var(--text-muted)' }}
          >
            {item.label}
          </p>
          <p
            className={
              compact
                ? 'text-sm font-bold mt-1.5 tabular-nums leading-none m-0 min-w-0 whitespace-nowrap'
                : 'text-2xl font-bold mt-1 tabular-nums m-0'
            }
            style={{ color: item.valueColor ?? 'var(--text)' }}
          >
            {item.value}
          </p>
          {item.hint && !compact && (
            <p className="text-xs mt-1 m-0 leading-snug" style={{ color: 'var(--text-muted)' }}>
              {item.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
