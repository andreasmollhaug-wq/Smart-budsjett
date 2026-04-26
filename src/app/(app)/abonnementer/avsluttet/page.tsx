'use client'

import { useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import AbonnementerSubnav from '@/components/subscriptions/AbonnementerSubnav'
import { subscriptionPriceSummaryLine } from '@/lib/serviceSubscriptionHelpers'
import { useActivePersonFinance, type ServiceSubscription } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

const MONTH_OPTIONS = [
  { v: 1, label: 'Januar' },
  { v: 2, label: 'Februar' },
  { v: 3, label: 'Mars' },
  { v: 4, label: 'April' },
  { v: 5, label: 'Mai' },
  { v: 6, label: 'Juni' },
  { v: 7, label: 'Juli' },
  { v: 8, label: 'August' },
  { v: 9, label: 'September' },
  { v: 10, label: 'Oktober' },
  { v: 11, label: 'November' },
  { v: 12, label: 'Desember' },
] as const

const YEAR_OPTS = (center: number) => [center - 1, center, center + 1]

export default function AbonnementerAvsluttetPage() {
  const {
    serviceSubscriptions,
    isHouseholdAggregate,
    markServiceSubscriptionCancelled,
    profiles,
    activeProfileId,
  } = useActivePersonFinance()
  const { formatNOK } = useNokDisplayFormatters()

  const readonly = isHouseholdAggregate
  const profileName = profiles.find((p) => p.id === activeProfileId)?.name ?? 'Meg'

  const now = useMemo(() => new Date(), [])
  const [cancelOpenId, setCancelOpenId] = useState<string | null>(null)
  const [cfMonth, setCfMonth] = useState(() => now.getMonth() + 1)
  const [cfYear, setCfYear] = useState(() => now.getFullYear())

  const activeSubs = useMemo(
    () => serviceSubscriptions.filter((s) => s.active && !s.cancelledFrom),
    [serviceSubscriptions],
  )

  const cancelledSubs = useMemo(
    () =>
      serviceSubscriptions
        .filter((s) => s.cancelledFrom)
        .slice()
        .sort((a, b) => {
          const ay = a.cancelledFrom!.year
          const by = b.cancelledFrom!.year
          if (ay !== by) return by - ay
          return b.cancelledFrom!.month - a.cancelledFrom!.month
        }),
    [serviceSubscriptions],
  )

  const openCancel = (s: ServiceSubscription) => {
    setCancelOpenId(s.id)
    setCfMonth(now.getMonth() + 1)
    setCfYear(now.getFullYear())
  }

  const submitCancel = (id: string) => {
    const res = markServiceSubscriptionCancelled(id, { year: cfYear, month: cfMonth })
    if (res.ok) setCancelOpenId(null)
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Avsluttede abonnement"
        subtitle="Marker avslutning og se tidligere avsluttede — for besparelse senere"
      />
      <AbonnementerSubnav />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {readonly && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
          >
            Du viser <strong style={{ color: 'var(--text)' }}>samlet husholdning</strong>. Avslutning registreres når du
            har valgt én profil i menyen øverst.
          </div>
        )}

        <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
          Når du avslutter et abonnement som er synket til budsjett og/eller har planlagte transaksjoner, justerer vi
          budsjettet fra avslutningsmåneden og fjerner fremtidige planlagte transaksjonslinjer. Manuelt registrerte trekk
          må du oppdatere selv.
        </p>

        {!readonly && (
          <section
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
                Har du avsluttet noen abonnement?
              </h2>
              <p className="text-xs mt-1 m-0" style={{ color: 'var(--text-muted)' }}>
                Profil: <strong style={{ color: 'var(--text)' }}>{profileName}</strong>
              </p>
            </div>
            {activeSubs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                Ingen aktive abonnementer å avslutte her. Legg til under «Registrer abonnement» først.
              </p>
            ) : (
              <ul className="list-none m-0 p-0">
                {activeSubs.map((s) => (
                  <li
                    key={s.id}
                    className="border-t px-4 py-4 first:border-t-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium m-0" style={{ color: 'var(--text)' }}>
                          {s.label}
                        </p>
                        <p className="mt-1 text-sm tabular-nums m-0" style={{ color: 'var(--text-muted)' }}>
                          {subscriptionPriceSummaryLine(s, formatNOK)}
                        </p>
                      </div>
                      {cancelOpenId === s.id ? (
                        <div className="flex flex-col gap-2 sm:items-end shrink-0">
                          <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                            Avsluttet fra og med (ingen kostnad denne måneden og utover)
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <select
                              value={cfMonth}
                              onChange={(e) => setCfMonth(parseInt(e.target.value, 10))}
                              className="rounded-lg px-2 py-2 text-sm"
                              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                              aria-label="Måned"
                            >
                              {MONTH_OPTIONS.map((o) => (
                                <option key={o.v} value={o.v}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={cfYear}
                              onChange={(e) => setCfYear(parseInt(e.target.value, 10))}
                              className="rounded-lg px-2 py-2 text-sm tabular-nums"
                              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                              aria-label="År"
                            >
                              {YEAR_OPTS(now.getFullYear()).map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-2 text-sm font-medium text-white"
                              style={{ background: 'var(--primary)' }}
                              onClick={() => submitCancel(s.id)}
                            >
                              Bekreft avslutning
                            </button>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-2 text-sm"
                              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                              onClick={() => setCancelOpenId(null)}
                            >
                              Avbryt
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="self-start rounded-lg px-3 py-2 text-sm font-medium shrink-0"
                          style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                          onClick={() => openCancel(s)}
                        >
                          Marker som avsluttet
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
              Allerede avsluttet
            </h2>
          </div>
          {cancelledSubs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm m-0" style={{ color: 'var(--text-muted)' }}>
              Ingen avsluttede abonnementer registrert ennå.
            </p>
          ) : (
            <ul className="list-none m-0 p-0">
              {cancelledSubs.map((s) => (
                <li
                  key={s.id}
                  className="border-t px-4 py-4 first:border-t-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="font-medium m-0" style={{ color: 'var(--text)' }}>
                    {s.label}
                  </p>
                  <p className="mt-1 text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                    Avsluttet fra{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {MONTH_OPTIONS.find((m) => m.v === s.cancelledFrom!.month)?.label} {s.cancelledFrom!.year}
                    </strong>
                  </p>
                  <p className="mt-1 text-sm tabular-nums m-0" style={{ color: 'var(--text-muted)' }}>
                    Pris før avslutning: {subscriptionPriceSummaryLine(s, formatNOK)}
                    {typeof s.monthlyEquivalentNokSnapshot === 'number' && (
                      <span className="ml-1">
                        (ca. {formatNOK(s.monthlyEquivalentNokSnapshot)} / mnd)
                      </span>
                    )}
                  </p>
                  {isHouseholdAggregate && s.sourceProfileId && (
                    <p className="mt-1 text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                      Profil: {profiles.find((p) => p.id === s.sourceProfileId)?.name}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
