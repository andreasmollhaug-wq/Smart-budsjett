'use client'

import Link from 'next/link'
import type { Transaction } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { isIsoDateString, transactionOnOrBeforeToday } from '@/lib/transactionPeriodFilter'
import { ChevronRight } from 'lucide-react'

type Props = {
  transactions: Transaction[]
  profiles: { id: string; name: string }[]
  activeProfileId: string
  isHouseholdAggregate: boolean
  transaksjonerHref: string
}

function profileLabel(
  pid: string | undefined,
  profiles: { id: string; name: string }[],
  _fallback: string,
): string | null {
  if (!pid) return null
  return profiles.find((p) => p.id === pid)?.name?.trim() ?? null
}

export default function DashboardRecentActivityCard({
  transactions,
  profiles,
  activeProfileId,
  isHouseholdAggregate,
  transaksjonerHref,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const rows = [...transactions]
    .filter((t) => typeof t.date === 'string' && isIsoDateString(t.date) && transactionOnOrBeforeToday(t))
    .sort((a, b) => {
      const da = a.date ?? ''
      const db = b.date ?? ''
      return db.localeCompare(da)
    })
    .slice(0, 5)

  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Siste aktivitet
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Fem siste transaksjoner i valgt periode (til og med i dag)
      </p>
      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen transaksjoner i perioden ennå.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => {
            const pl = profileLabel(t.profileId, profiles, activeProfileId)
            const desc = (t.description ?? '').trim() || t.category
            const isInc = t.type === 'income'
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl p-3 text-sm"
                style={{ background: 'var(--bg)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
                    {desc}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {t.date}
                    {isHouseholdAggregate && pl ? ` · ${pl}` : ''}
                  </p>
                </div>
                <span
                  className="shrink-0 tabular-nums font-semibold"
                  style={{ color: isInc ? 'var(--success)' : 'var(--danger)' }}
                >
                  {isInc ? '+' : '−'}
                  {formatNOK(t.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <Link
        href={transaksjonerHref}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
        style={{ color: 'var(--primary)' }}
      >
        Åpne transaksjoner
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}
