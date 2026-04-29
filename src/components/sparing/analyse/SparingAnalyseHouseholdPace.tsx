'use client'

import { Fragment, useMemo } from 'react'
import type { HouseholdAnalysePaceRow } from '@/lib/sparingAnalyseDerived'
import { sumHouseholdPaceByProfile } from '@/lib/sparingAnalyseDerived'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

type ProfileLite = { id: string; name: string }

type Props = {
  paceRows: HouseholdAnalysePaceRow[]
  profiles: ProfileLite[]
  chartPrimary: string
}

function paceStatusLabel(status: HouseholdAnalysePaceRow['pace']['status']): string {
  switch (status) {
    case 'ok':
      return 'Aktiv plan'
    case 'no_date':
      return 'Mangler måldato'
    case 'goal_met':
      return 'Mål nådd'
    case 'past_date':
      return 'Frist passert'
    default:
      return ''
  }
}

export default function SparingAnalyseHouseholdPace({ paceRows, profiles, chartPrimary }: Props) {
  const { formatNOK } = useNokDisplayFormatters()

  const profileTotals = useMemo(() => sumHouseholdPaceByProfile(paceRows, profiles), [paceRows, profiles])

  const tableGroups = useMemo(() => {
    const sortedProfiles = [...profiles].sort((a, b) =>
      a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' }),
    )
    const totalsById = new Map(profileTotals.map((t) => [t.profileId, t]))
    const rowsByPid = new Map<string, HouseholdAnalysePaceRow[]>()
    for (const r of paceRows) {
      const arr = rowsByPid.get(r.profileId) ?? []
      arr.push(r)
      rowsByPid.set(r.profileId, arr)
    }
    for (const arr of rowsByPid.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' }))
    }
    return sortedProfiles
      .map((p) => ({
        profileId: p.id,
        profileName: p.name.trim() || p.id,
        rows: rowsByPid.get(p.id) ?? [],
        totals: totalsById.get(p.id),
      }))
      .filter((g) => g.rows.length > 0)
  }, [paceRows, profiles, profileTotals])

  const hasAnyOkGoal = paceRows.some((r) => r.pace.status === 'ok')

  if (paceRows.length === 0) {
    return (
      <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
        Ingen mål i utvalget — legg til sparemål med måldato for å se sparetempo per medlem.
      </p>
    )
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Sparetempo mot måldato
        </h3>
        <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
          Tallene er et lineært snitt: gjenværende beløp fordelt på kalenderdager til måldato per mål — ikke en prognose
          basert på tidligere sparing.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 min-w-0">
        {profileTotals.map((t) => (
          <div
            key={t.profileId}
            className="rounded-xl border p-4 min-w-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <p className="text-sm font-semibold truncate min-w-0" style={{ color: 'var(--text)' }} title={t.profileName}>
              {t.profileName}
            </p>
            <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
              Sum av krav per mål for dette medlemmet (parallelle mål summeres).
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Per uke
                </dt>
                <dd className="mt-0.5 tabular-nums font-semibold" style={{ color: t.weeklyNokSum > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                  {t.weeklyNokSum > 0 ? formatNOK(t.weeklyNokSum) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Per måned
                </dt>
                <dd className="mt-0.5 tabular-nums font-semibold" style={{ color: t.monthlyNokSum > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                  {t.monthlyNokSum > 0 ? formatNOK(t.monthlyNokSum) : '—'}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {!hasAnyOkGoal ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen mål har både måldato i fremtiden og gjenværende beløp — sett måldato eller sjekk målene dine.
        </p>
      ) : null}

      <details className="group rounded-xl border min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold touch-manipulation outline-none marker:content-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset rounded-xl">
          <span style={{ color: 'var(--text)' }}>Detaljer per mål</span>
          <span className="text-xs font-normal tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {paceRows.length} mål
          </span>
        </summary>
        <div className="overflow-x-auto border-t px-2 pb-3 pt-1 sm:px-4" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th scope="col" className="px-2 py-2 text-left font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                  Mål
                </th>
                <th scope="col" className="px-2 py-2 text-left font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                  Medlem
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                  Gjenstår
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                  Dager
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                  Kr/uke
                </th>
                <th scope="col" className="px-2 py-2 text-right font-semibold tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                  Kr/mnd
                </th>
                <th scope="col" className="px-2 py-2 text-left font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {tableGroups.map((g) => (
                <Fragment key={g.profileId}>
                  {g.rows.map((r) => (
                    <tr key={r.goalId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="max-w-[10rem] px-2 py-2 sm:max-w-none sm:px-3">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-sm border"
                            style={{ background: r.color || chartPrimary, borderColor: 'var(--border)' }}
                            aria-hidden
                          />
                          <span className="min-w-0 truncate font-medium" style={{ color: 'var(--text)' }} title={r.name}>
                            {r.name}
                          </span>
                        </span>
                      </td>
                      <td className="max-w-[8rem] truncate px-2 py-2 sm:px-3" style={{ color: 'var(--text-muted)' }} title={r.profileName}>
                        {r.profileName}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                        {formatNOK(r.remainingNok)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3" style={{ color: 'var(--text-muted)' }}>
                        {r.pace.daysLeft != null ? r.pace.daysLeft : '—'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                        {r.pace.weeklyNok != null ? formatNOK(r.pace.weeklyNok) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3" style={{ color: 'var(--text)' }}>
                        {r.pace.monthlyNok != null ? formatNOK(r.pace.monthlyNok) : '—'}
                      </td>
                      <td className="max-w-[9rem] truncate px-2 py-2 text-xs sm:px-3 sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                        {paceStatusLabel(r.pace.status)}
                      </td>
                    </tr>
                  ))}
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg)',
                    }}
                  >
                    <td colSpan={2} className="px-2 py-2 pl-3 font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                      Sum ({g.profileName})
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                      {formatNOK(
                        g.rows.filter((r) => r.pace.status === 'ok').reduce((s, r) => s + r.remainingNok, 0),
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3" style={{ color: 'var(--text-muted)' }}>
                      —
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                      {g.totals && g.totals.weeklyNokSum > 0 ? formatNOK(g.totals.weeklyNokSum) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums font-semibold sm:px-3" style={{ color: 'var(--text)' }}>
                      {g.totals && g.totals.monthlyNokSum > 0 ? formatNOK(g.totals.monthlyNokSum) : '—'}
                    </td>
                    <td className="px-2 py-2 text-xs font-semibold sm:px-3 sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                      Deltotal
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
