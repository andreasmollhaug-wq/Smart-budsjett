'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import GjeldSubnav from '@/components/debt/GjeldSubnav'
import { useStore } from '@/lib/store'
import { buildHouseholdDebtOverview, householdDebtTypeOrder } from '@/lib/householdDebtOverview'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { debtColors, debtTypeLabels } from '@/lib/debtDisplay'
import type { Debt } from '@/lib/store'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipPayload } from 'recharts'
import HouseholdMemberDebtModal from '@/components/debt/HouseholdMemberDebtModal'
import { ChevronRight } from 'lucide-react'

function truncateChartName(name: string, maxLen = 14): string {
  const t = name.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`
}

type StackRow = {
  profileId: string
  shortName: string
  fullName: string
} & Record<Debt['type'], number>

type ChartMemberRow = {
  profileId: string
  shortName: string
  fullName: string
  restgjeld?: number
  manedlig?: number
}

function StackedTooltip({
  active,
  payload,
  formatNok,
}: {
  active?: boolean
  payload?: TooltipPayload
  formatNok: (n: number) => string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as StackRow | undefined
  const title = row?.fullName ?? ''
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm max-w-[min(100vw-2rem,20rem)]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="font-medium mb-1.5 truncate" style={{ color: 'var(--text)' }} title={title}>
        {title}
      </p>
      {payload
        .filter((p) => Number(p.value) > 0)
        .map((p) => (
          <p key={String(p.dataKey)} className="flex justify-between gap-4" style={{ color: 'var(--text-muted)' }}>
            <span>{p.name}</span>
            <span className="tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNok(p.value == null ? 0 : Number(p.value))}
            </span>
          </p>
        ))}
    </div>
  )
}

export default function GjeldHusholdningPage() {
  const { formatNOK, formatNOKChartLabel } = useNokDisplayFormatters()
  const router = useRouter()
  const subscriptionPlan = useStore((s) => s.subscriptionPlan)
  const profiles = useStore((s) => s.profiles)
  const people = useStore((s) => s.people)
  const financeScope = useStore((s) => s.financeScope)
  const activeProfileId = useStore((s) => s.activeProfileId)

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const allowed = subscriptionPlan === 'family' && profiles.length >= 2

  useEffect(() => {
    if (!allowed) {
      router.replace('/gjeld')
    }
  }, [allowed, router])

  useEffect(() => {
    setSelectedProfileId(null)
  }, [financeScope, activeProfileId])

  /** Følger «Viser data for»: husholdning = alle profiler, én profil = kun den profilen. */
  const profilesForOverview = useMemo(() => {
    if (financeScope === 'household') return profiles
    const p = profiles.find((x) => x.id === activeProfileId)
    return p ? [p] : profiles.length > 0 ? [profiles[0]!] : []
  }, [financeScope, profiles, activeProfileId])

  const isHouseholdView = financeScope === 'household'

  const activeProfileName = profiles.find((p) => p.id === activeProfileId)?.name?.trim() || 'Profil'

  const overview = useMemo(
    () => buildHouseholdDebtOverview(people, profilesForOverview),
    [people, profilesForOverview],
  )

  const { household, members } = overview

  const selectedMember = useMemo(
    () => (selectedProfileId ? members.find((m) => m.profileId === selectedProfileId) ?? null : null),
    [selectedProfileId, members],
  )

  const selectedDebts = useMemo(
    () => (selectedProfileId ? people[selectedProfileId]?.debts ?? [] : []),
    [selectedProfileId, people],
  )

  const openMemberFromBar = useCallback((item: unknown) => {
    const payload =
      item && typeof item === 'object' && 'payload' in item
        ? (item as { payload?: ChartMemberRow }).payload
        : undefined
    if (payload?.profileId) setSelectedProfileId(payload.profileId)
  }, [])

  const chartRemaining = useMemo(
    () =>
      members.map((m) => ({
        profileId: m.profileId,
        shortName: truncateChartName(m.name),
        fullName: m.name,
        restgjeld: m.totalRemaining,
      })),
    [members],
  )

  const chartMonthly = useMemo(
    () =>
      members.map((m) => ({
        profileId: m.profileId,
        shortName: truncateChartName(m.name),
        fullName: m.name,
        manedlig: m.totalMonthlyEffective,
      })),
    [members],
  )

  const chartStacked = useMemo(() => {
    return members.map((m) => {
      const row: StackRow = {
        profileId: m.profileId,
        shortName: truncateChartName(m.name),
        fullName: m.name,
        mortgage: m.remainingByType.mortgage,
        loan: m.remainingByType.loan,
        consumer_loan: m.remainingByType.consumer_loan,
        refinancing: m.remainingByType.refinancing,
        student_loan: m.remainingByType.student_loan,
        credit_card: m.remainingByType.credit_card,
        other: m.remainingByType.other,
      }
      return row
    })
  }, [members])

  const typesPresent = useMemo(
    () => householdDebtTypeOrder.filter((t) => household.remainingByType[t] > 0),
    [household.remainingByType],
  )

  if (!allowed) {
    return null
  }

  const headerSubtitle = isHouseholdView
    ? 'Husholdning — gjeld fordelt på familiemedlemmer'
    : `Husholdning — kun ${activeProfileName}`

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' } as const

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Gjeld" subtitle={headerSubtitle} />
      <GjeldSubnav />
      <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pt-6 lg:px-8 lg:py-8">
        <p
          className="text-xs sm:text-sm lg:hidden rounded-xl px-3 py-2"
          style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {isHouseholdView ? (
            <>Trykk på et navn eller en søyle for å se alle lån og tall bak sammendraget.</>
          ) : (
            <>
              Viser gjeld for <strong style={{ color: 'var(--text)' }}>{activeProfileName}</strong>. Velg «Husholdning»
              øverst for å se alle.
            </>
          )}
        </p>

        {!isHouseholdView && (
          <p
            className="text-xs sm:text-sm hidden lg:block rounded-xl px-3 py-2 max-w-2xl"
            style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            Tallene følger «Viser data for»: du ser kun <strong style={{ color: 'var(--text)' }}>{activeProfileName}</strong>.
            Bytt til husholdning i profilvelgeren for samlet oversikt over alle.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isHouseholdView ? 'Total gjeld (husholdning)' : `Total gjeld (${activeProfileName})`}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--danger)' }}>
              {formatNOK(household.totalRemaining)}
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Månedlige avdrag (effektivt)
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {formatNOK(household.totalMonthlyEffective)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              0 kr for lån med aktiv avdragspause
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Høyeste rente
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--warning)' }}>
              {household.debtCount > 0 ? `${household.highestInterestRate}%` : '—'}
            </p>
          </div>
          <div className="rounded-2xl p-4 sm:p-5 min-w-0" style={cardStyle}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ca. årlig rentekostnad
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {household.debtCount > 0 ? formatNOK(household.totalAnnualInterest) : '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Restgjeld × rente / 100 per lån
            </p>
          </div>
        </div>

        {household.debtCount === 0 && (
          <div
            className="rounded-2xl p-8 text-center max-w-lg mx-auto"
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              Ingen gjeld registrert ennå
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {isHouseholdView ? (
                <>
                  Når hvert medlem legger inn lån under sin profil (Gjeld → Oversikt), vises fordelingen her automatisk.
                </>
              ) : (
                <>
                  Ingen gjeld registrert på {activeProfileName}. Bytt profil eller gå til Gjeld → Oversikt for å legge inn
                  lån på denne profilen.
                </>
              )}
            </p>
            <Link
              href="/gjeld"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-medium touch-manipulation"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Gå til gjeldsoversikt
            </Link>
          </div>
        )}

        {household.debtCount > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
              {members.map((m) => (
                <button
                  key={m.profileId}
                  type="button"
                  onClick={() => setSelectedProfileId(m.profileId)}
                  aria-label={`Vis alle lån og tall for ${m.name}`}
                  className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 w-full text-left transition-[transform,box-shadow] touch-manipulation focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] hover:brightness-[1.02] active:scale-[0.99]"
                  style={cardStyle}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                      {m.name}
                    </h2>
                    <ChevronRight
                      className="shrink-0 mt-0.5 opacity-70"
                      size={22}
                      aria-hidden
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </div>
                  {m.debtCount === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Ingen gjeld registrert på denne profilen.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between gap-3 min-w-0">
                        <span style={{ color: 'var(--text-muted)' }}>Restgjeld</span>
                        <span className="font-semibold tabular-nums shrink-0" style={{ color: 'var(--danger)' }}>
                          {formatNOK(m.totalRemaining)}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3 min-w-0">
                        <span style={{ color: 'var(--text-muted)' }}>Månedlig (effektivt)</span>
                        <span className="font-medium tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                          {formatNOK(m.totalMonthlyEffective)}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3 min-w-0">
                        <span style={{ color: 'var(--text-muted)' }}>Antall lån</span>
                        <span className="tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                          {m.debtCount}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3 min-w-0">
                        <span style={{ color: 'var(--text-muted)' }}>Høyeste rente</span>
                        <span className="tabular-nums shrink-0" style={{ color: 'var(--warning)' }}>
                          {m.highestInterestRate}%
                        </span>
                      </li>
                      <li className="flex justify-between gap-3 min-w-0">
                        <span style={{ color: 'var(--text-muted)' }}>Ca. årlig rentekostnad</span>
                        <span className="tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                          {formatNOK(m.totalAnnualInterest)}
                        </span>
                      </li>
                    </ul>
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
              <div className="rounded-2xl p-4 sm:p-6 min-w-0" style={cardStyle}>
                <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {isHouseholdView ? 'Restgjeld per person' : 'Restgjeld'}
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  {isHouseholdView ? (
                    <>
                      Sammenligning av registrert restgjeld. Tall over søylene er forkortet (k = tusen, M = millioner).
                      Trykk på en søyle for detaljer.
                    </>
                  ) : (
                    <>
                      Registrert restgjeld for {activeProfileName}. Tall over søylene er forkortet (k = tusen, M =
                      millioner).
                    </>
                  )}
                </p>
                <div className="h-[260px] w-full min-w-0 sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRemaining} margin={{ top: 22, right: 4, bottom: 4, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--primary-pale)" />
                      <XAxis dataKey="shortName" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const row = payload[0]?.payload as (typeof chartRemaining)[0] | undefined
                          return (
                            <div
                              className="rounded-lg border px-3 py-2 text-xs shadow-sm"
                              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                            >
                              <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>
                                {row?.fullName}
                              </p>
                              <p style={{ color: 'var(--text-muted)' }}>
                                Restgjeld:{' '}
                                <span className="tabular-nums" style={{ color: 'var(--text)' }}>
                                  {formatNOK(row?.restgjeld ?? 0)}
                                </span>
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar
                        dataKey="restgjeld"
                        fill="var(--primary)"
                        name="Restgjeld"
                        radius={[4, 4, 0, 0]}
                        className="cursor-pointer outline-none"
                        onClick={openMemberFromBar}
                      >
                        <LabelList
                          dataKey="restgjeld"
                          position="top"
                          offset={4}
                          formatter={(v) => {
                            const n = Number(v)
                            return Number.isFinite(n) && n > 0 ? formatNOKChartLabel(n) : ''
                          }}
                          style={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                          className="tabular-nums"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl p-4 sm:p-6 min-w-0" style={cardStyle}>
                <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {isHouseholdView ? 'Månedlige avdrag per person' : 'Månedlige avdrag'}
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  {isHouseholdView ? (
                    <>
                      Summen av avdrag du har registrert (pause gir 0 kr). Samme forkortelse av tall som over. Trykk på en
                      søyle for detaljer.
                    </>
                  ) : (
                    <>Summen av avdrag registrert for {activeProfileName} (pause gir 0 kr). Samme forkortelse som over.</>
                  )}
                </p>
                <div className="h-[260px] w-full min-w-0 sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartMonthly} margin={{ top: 22, right: 4, bottom: 4, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--primary-pale)" />
                      <XAxis dataKey="shortName" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${v}`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const row = payload[0]?.payload as (typeof chartMonthly)[0] | undefined
                          return (
                            <div
                              className="rounded-lg border px-3 py-2 text-xs shadow-sm"
                              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                            >
                              <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>
                                {row?.fullName}
                              </p>
                              <p style={{ color: 'var(--text-muted)' }}>
                                Per måned:{' '}
                                <span className="tabular-nums" style={{ color: 'var(--text)' }}>
                                  {formatNOK(row?.manedlig ?? 0)}
                                </span>
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar
                        dataKey="manedlig"
                        fill="var(--accent)"
                        name="Månedlig"
                        radius={[4, 4, 0, 0]}
                        className="cursor-pointer outline-none"
                        onClick={openMemberFromBar}
                      >
                        <LabelList
                          dataKey="manedlig"
                          position="top"
                          offset={4}
                          formatter={(v) => {
                            const n = Number(v)
                            return Number.isFinite(n) && n > 0 ? formatNOKChartLabel(n) : ''
                          }}
                          style={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                          className="tabular-nums"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {typesPresent.length > 0 && (
              <div className="rounded-2xl p-4 sm:p-6 min-w-0" style={cardStyle}>
                <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {isHouseholdView ? 'Restgjeld etter lånetype (stablet)' : 'Restgjeld etter lånetype'}
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  {isHouseholdView ? (
                    <>Fordeling av restgjeld per person og type. Trykk på en søyle for detaljer.</>
                  ) : (
                    <>Fordeling av restgjeld for {activeProfileName} etter type.</>
                  )}
                </p>
                <div className="h-[min(420px,calc(100vh-12rem))] w-full min-w-0 sm:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartStacked} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--primary-pale)" />
                      <XAxis dataKey="shortName" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <Tooltip content={<StackedTooltip formatNok={formatNOK} />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
                        formatter={(value) => <span style={{ color: 'var(--text-muted)' }}>{value}</span>}
                      />
                      {typesPresent.map((t) => (
                        <Bar
                          key={t}
                          dataKey={t}
                          stackId="types"
                          fill={debtColors[t]}
                          name={debtTypeLabels[t]}
                          className="cursor-pointer outline-none"
                          onClick={openMemberFromBar}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center justify-start"
              style={{ color: 'var(--text-muted)' }}
            >
              <Link
                href="/gjeld"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium border touch-manipulation"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                Full gjeldsoversikt
              </Link>
              <Link
                href="/snoball"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium border touch-manipulation"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                Snøball / nedbetalingsplan
              </Link>
            </div>
          </>
        )}
      </div>

      <HouseholdMemberDebtModal
        open={selectedProfileId !== null}
        onClose={() => setSelectedProfileId(null)}
        member={selectedMember}
        debts={selectedDebts}
      />
    </div>
  )
}
