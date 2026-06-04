'use client'

import AdminMetricPanel from '@/components/admin/AdminMetricPanel'
import type { AdminSubscriberEntry } from '@/lib/admin/types'
import { ChevronDown, User } from 'lucide-react'

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  Solo: { bg: '#3B5BDB18', color: '#3B5BDB' },
  Familie: { bg: '#7048E818', color: '#7048E8' },
  'Ukjent plan': { bg: 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: 'var(--text-muted)' },
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Aktiv: { bg: '#09926818', color: '#099268' },
  Prøveperiode: { bg: '#3B5BDB18', color: '#3B5BDB' },
  'Forfalt betaling': { bg: '#E6770018', color: '#E67700' },
  Bestefar: { bg: 'color-mix(in srgb, var(--text-muted) 12%, transparent)', color: 'var(--text-muted)' },
}

function Badge({ label, styles }: { label: string; styles: { bg: string; color: string } }) {
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold sm:text-xs"
      style={{ background: styles.bg, color: styles.color }}
    >
      {label}
    </span>
  )
}

export default function AdminSubscribersSection({ subscribers }: { subscribers: AdminSubscriberEntry[] }) {
  const soloCount = subscribers.filter((s) => s.plan === 'solo').length
  const familyCount = subscribers.filter((s) => s.plan === 'family').length

  return (
    <section className="min-w-0">
      <AdminMetricPanel
        title="Abonnenter"
        subtitle={
          subscribers.length > 0
            ? `${subscribers.length} med tilgang nå · Solo ${soloCount} · Familie ${familyCount}`
            : 'Ingen aktive abonnenter med e-post'
        }
        accent="#7048E8"
      >
        {subscribers.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
            Ingen brukere med aktiv tilgang (prøve, aktiv, forfalt eller bestefar).
          </p>
        ) : (
          <details className="min-w-0 group">
            <summary
              className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 touch-manipulation sm:px-4 [&::-webkit-details-marker]:hidden"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                <span className="group-open:hidden">Vis abonnentliste ({subscribers.length})</span>
                <span className="hidden group-open:inline">Skjul abonnentliste</span>
              </span>
              <ChevronDown
                size={18}
                className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden
              />
            </summary>
            <div className="mt-3 min-w-0 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider sm:px-4 sm:text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Bruker
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider sm:text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Abonnement
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-wider sm:px-4 sm:text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row, index) => {
                  const planStyle = PLAN_STYLES[row.planLabel] ?? PLAN_STYLES['Ukjent plan']
                  const statusStyle = STATUS_STYLES[row.statusLabel] ?? {
                    bg: 'var(--bg)',
                    color: 'var(--text-muted)',
                  }
                  const zebra = index % 2 === 1
                  return (
                    <tr
                      key={row.userId}
                      style={{
                        borderBottom: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
                        background: zebra
                          ? 'color-mix(in srgb, var(--text) 2%, var(--surface))'
                          : undefined,
                      }}
                    >
                      <td className="min-w-0 px-3 py-3 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                            aria-hidden
                          >
                            <User size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium" style={{ color: 'var(--text)' }}>
                              {row.displayName ?? row.email.split('@')[0]}
                            </p>
                            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                              {row.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                        <Badge label={row.planLabel} styles={planStyle} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                        <Badge label={row.statusLabel} styles={statusStyle} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </details>
        )}
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Kun synlig for admin-viewers. Bestefar = legacy-tilgang uten Stripe-abonnement. Ukjent plan =
          mangler plan i databasen.
        </p>
      </AdminMetricPanel>
    </section>
  )
}
