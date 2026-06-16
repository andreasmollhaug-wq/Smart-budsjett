'use client'

import type { CreditorRegistryOverview } from '@/lib/creditorRegistry/aggregate'

type Props = {
  overview: CreditorRegistryOverview
  formatNOK: (n: number) => string
}

export default function CreditorRegistryKpiRow({ overview, formatNOK }: Props) {
  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' } as const

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Total restgjeld
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--danger)' }}>
          {formatNOK(overview.totalRemaining)}
        </p>
      </div>
      <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Antall kreditorer
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--text)' }}>
          {overview.creditorCount}
        </p>
      </div>
      <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Antall lån
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--text)' }}>
          {overview.loanCount}
        </p>
      </div>
      <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Månedlige avdrag
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--text)' }}>
          {formatNOK(overview.totalMonthly)}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Sum registrerte avdrag per måned
        </p>
      </div>
    </div>
  )
}
