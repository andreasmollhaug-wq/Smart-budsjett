'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import Header from '@/components/layout/Header'
import AbonnementerSubnav from '@/components/subscriptions/AbonnementerSubnav'
import SubscriptionHouseholdDonut from '@/components/subscriptions/SubscriptionHouseholdDonut'
import { monthlyEquivalentNok, yearlyEquivalentNok } from '@/lib/serviceSubscriptionHelpers'
import { useActivePersonFinance, useStore, type ServiceSubscription } from '@/lib/store'
import { formatNOK } from '@/lib/utils'

function normLabel(s: string): string {
  return s.trim().toLowerCase()
}

export default function AbonnementerSammendragPage() {
  const { profiles } = useActivePersonFinance()
  const people = useStore((s) => s.people)

  const perProfile = useMemo(() => {
    return profiles.map((p) => {
      const subs = (people[p.id]?.serviceSubscriptions ?? []).filter((s) => s.active)
      let m = 0
      let y = 0
      for (const s of subs) {
        m += monthlyEquivalentNok(s)
        y += yearlyEquivalentNok(s)
      }
      return { profileId: p.id, name: p.name, subs, monthly: m, yearly: y }
    })
  }, [people, profiles])

  const householdTotals = useMemo(() => {
    let monthly = 0
    let yearly = 0
    let activeCount = 0
    for (const row of perProfile) {
      for (const s of row.subs) {
        activeCount += 1
        monthly += monthlyEquivalentNok(s)
        yearly += yearlyEquivalentNok(s)
      }
    }
    return { monthly, yearly, activeCount }
  }, [perProfile])

  /** Samme tjenestenavn registrert på minst to profiler (familie) — enkel oversikt, alfabetisk. */
  const overlapByLabel = useMemo(() => {
    const map = new Map<string, { displayLabel: string; profileIds: Set<string> }>()
    for (const row of perProfile) {
      for (const s of row.subs) {
        const key = normLabel(s.label)
        if (!key) continue
        let e = map.get(key)
        if (!e) {
          e = { displayLabel: s.label.trim() || 'Uten navn', profileIds: new Set() }
          map.set(key, e)
        }
        e.profileIds.add(row.profileId)
      }
    }
    const out: { displayLabel: string; profileNames: string[] }[] = []
    for (const [, v] of map) {
      if (v.profileIds.size >= 2) {
        const names = profiles.filter((p) => v.profileIds.has(p.id)).map((p) => p.name)
        out.push({ displayLabel: v.displayLabel, profileNames: names })
      }
    }
    out.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, 'nb'))
    return out
  }, [perProfile, profiles])

  /** Alle aktive abonnementsrader i husholdningen, dyrest per måned først (solo: én profils liste). */
  const subscriptionRanking = useMemo(() => {
    const rows: {
      key: string
      label: string
      profileName: string
      monthly: number
      yearly: number
    }[] = []
    for (const row of perProfile) {
      for (const s of row.subs) {
        rows.push({
          key: `${row.profileId}-${s.id}`,
          label: s.label.trim() || 'Abonnement',
          profileName: row.name,
          monthly: monthlyEquivalentNok(s),
          yearly: yearlyEquivalentNok(s),
        })
      }
    }
    rows.sort((a, b) => b.monthly - a.monthly || a.label.localeCompare(b.label, 'nb'))
    return rows
  }, [perProfile])

  const donutRows = useMemo(
    () =>
      perProfile.map((r) => ({
        profileId: r.profileId,
        name: r.name,
        monthly: r.monthly,
        yearly: r.yearly,
      })),
    [perProfile],
  )

  const hasAny = householdTotals.activeCount > 0

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Abonnementsoversikt"
        subtitle="Hvem har hvilke tjenester og hva det koster per måned og år"
      />
      <AbonnementerSubnav />

      <div className="mx-auto max-w-4xl space-y-6 px-3 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Sum husholdning / mnd (aktive)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(householdTotals.monthly)}
            </p>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Sum husholdning / år (aktive)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(householdTotals.yearly)}
            </p>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Antall aktive abonnementer
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {householdTotals.activeCount}
            </p>
          </div>
        </div>

        {!hasAny ? (
          <p
            className="text-sm text-center py-8 rounded-2xl border px-4"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Ingen aktive tjenesteabonnementer registrert ennå.{' '}
            <Link
              href="/abonnementer"
              className="font-medium underline-offset-2 hover:underline inline-block min-h-[44px] sm:min-h-0 py-2 sm:py-0"
              style={{ color: 'var(--primary)' }}
            >
              Gå til Registrer abonnement
            </Link>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-start">
              <div
                className={`min-w-0 w-full ${hasAny ? 'lg:col-span-7' : 'lg:col-span-12'}`}
              >
                <div
                  className="rounded-2xl border p-4 sm:p-5 min-w-0"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <SubscriptionHouseholdDonut rows={donutRows} totalMonthly={householdTotals.monthly} />
                </div>
              </div>

              {hasAny ? (
                <div
                  className="lg:col-span-5 w-full max-w-full lg:max-w-md lg:justify-self-end flex flex-col gap-4 self-start min-w-0"
                >
                  {overlapByLabel.length > 0 ? (
                    <section
                      className="rounded-2xl border p-3 sm:p-4 lg:max-h-[min(42vh,18rem)] lg:overflow-y-auto overscroll-y-contain"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                      aria-label="Tjenester registrert på flere profiler"
                    >
                      <h2 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--primary)' }}>
                        Samme tjeneste på flere profiler
                      </h2>
                      <ul className="list-none space-y-1.5 m-0 p-0 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                        {overlapByLabel.map((o) => (
                          <li key={o.displayLabel}>
                            <strong style={{ color: 'var(--text)' }}>{o.displayLabel}</strong>
                            {' — '}
                            {o.profileNames.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section
                    className="rounded-2xl border p-3 sm:p-4 lg:max-h-[min(50vh,22rem)] lg:overflow-y-auto overscroll-y-contain"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    aria-label="Rangering etter månedskostnad"
                  >
                    <h2 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--primary)' }}>
                      Rangering etter månedskostnad
                    </h2>
                    <p className="text-[11px] leading-snug mb-3 m-0" style={{ color: 'var(--text-muted)' }}>
                      Dyrest først — alle aktive abonnementer{profiles.length > 1 ? ' i husholdningen' : ''} (ekvivalent per
                      måned).
                    </p>
                    <ol className="list-decimal pl-4 m-0 space-y-2.5 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {subscriptionRanking.map((r) => (
                        <li key={r.key} className="pl-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                            <span>
                              <strong style={{ color: 'var(--text)' }}>{r.label}</strong>
                              {profiles.length > 1 ? (
                                <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                                  {' '}
                                  — {r.profileName}
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <p className="text-[11px] tabular-nums m-0 mt-0.5" style={{ color: 'var(--text)' }}>
                            {formatNOK(r.monthly)} / mnd · {formatNOK(r.yearly)} / år
                          </p>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              {perProfile.map((row) => (
                <section
                  key={row.profileId}
                  className="rounded-2xl border overflow-hidden max-w-full w-full min-w-0"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div
                    className="border-b px-3 py-3 sm:px-4 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center sm:gap-2"
                    style={{
                      borderColor: 'var(--accent)',
                      background: 'color-mix(in srgb, var(--primary) 22%, white)',
                    }}
                  >
                    <h2 className="text-sm font-semibold min-w-0" style={{ color: 'var(--primary)' }}>
                      {row.name}
                    </h2>
                    {row.subs.length > 0 ? (
                      <p
                        className="text-xs font-medium tabular-nums w-full sm:w-auto sm:text-right sm:shrink-0 mt-1 pt-2 border-t sm:mt-0 sm:pt-0 sm:border-t-0"
                        style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}
                      >
                        {formatNOK(row.monthly)} / mnd · {formatNOK(row.yearly)} / år
                      </p>
                    ) : null}
                  </div>
                  {row.subs.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                      Ingen aktive abonnementer for denne profilen.
                    </p>
                  ) : (
                    <div className="overflow-x-auto overscroll-x-contain -mx-0 min-w-0 touch-pan-x">
                      <table className="w-full text-sm min-w-[17.5rem] sm:min-w-[28rem] border-collapse">
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--accent)',
                              background: 'color-mix(in srgb, var(--primary) 6%, var(--surface))',
                            }}
                          >
                            <th
                              className="text-left py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wide"
                              style={{ color: 'var(--primary)' }}
                            >
                              Tjeneste
                            </th>
                            <th
                              className="text-right py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                              style={{ color: 'var(--primary)' }}
                            >
                              Per mnd
                            </th>
                            <th
                              className="text-right py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                              style={{ color: 'var(--primary)' }}
                            >
                              Per år
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.subs.map((s: ServiceSubscription) => (
                            <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                              <td className="py-2.5 sm:py-3 px-2.5 sm:px-4 align-top max-w-[55vw] sm:max-w-none">
                                <span className="text-[13px] sm:text-sm" style={{ color: 'var(--text)' }}>
                                  {s.label}
                                </span>
                                <p className="mt-0.5 text-[11px] sm:text-xs m-0 break-words" style={{ color: 'var(--text-muted)' }}>
                                  Oppgitt: {formatNOK(s.amountNok)} / {s.billing === 'monthly' ? 'mnd' : 'år'}
                                </p>
                              </td>
                              <td
                                className="py-2.5 sm:py-3 px-2 sm:px-3 text-right text-[13px] sm:text-sm tabular-nums align-top whitespace-nowrap"
                                style={{ color: 'var(--text)' }}
                              >
                                {formatNOK(monthlyEquivalentNok(s))}
                              </td>
                              <td
                                className="py-2.5 sm:py-3 px-2.5 sm:px-4 text-right text-[13px] sm:text-sm tabular-nums align-top whitespace-nowrap"
                                style={{ color: 'var(--text)' }}
                              >
                                {formatNOK(yearlyEquivalentNok(s))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
