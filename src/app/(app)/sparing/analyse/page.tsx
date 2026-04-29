'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import SparingAnalyseGoalDistribution from '@/components/sparing/analyse/SparingAnalyseGoalDistribution'
import SparingAnalyseHouseholdPace from '@/components/sparing/analyse/SparingAnalyseHouseholdPace'
import SparingAnalyseKpiModal, {
  type SparingAnalyseKpiKind,
} from '@/components/sparing/analyse/SparingAnalyseKpiModal'
import Header from '@/components/layout/Header'
import SparingAnalyseTourHeaderButton from '@/features/sparing/SparingAnalyseTourHeaderButton'
import SparingAnalyseTourProvider from '@/features/sparing/SparingAnalyseTourProvider'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { periodSubtitle } from '@/lib/budgetPeriod'
import {
  buildAnalyseKpi,
  buildAnalyseYearOptions,
  buildGoalShareRows,
  buildHouseholdAnalysePaceRows,
  buildMonthlySparingActivitySeries,
  filterSavingsGoalsForAnalyse,
  sumAggregateMonthlyPace,
  sumAggregateWeeklyPace,
  sumEffectiveSavedBySourceProfile,
} from '@/lib/sparingAnalyseDerived'
import { useActivePersonFinance, useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { chartColorsForUiPalette } from '@/lib/uiColorPalette'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  CalendarClock,
  PiggyBank,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

export default function SparingAnalysePage() {
  const { formatNOK } = useNokDisplayFormatters()
  const budgetYear = useStore((s) => s.budgetYear)
  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const { primary: chartPrimary } = chartColorsForUiPalette(uiColorPalette)

  const {
    savingsGoals,
    transactions,
    budgetCategories,
    activeProfileId,
    profiles,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const activeProfileName = profiles.find((p) => p.id === activeProfileId)?.name ?? 'Profil'

  const includeCompletedSwitchId = useId()

  const yearOptions = useMemo(
    () =>
      buildAnalyseYearOptions({
        budgetYear,
        transactions,
        savingsGoals,
      }),
    [budgetYear, transactions, savingsGoals],
  )

  const [filterYear, setFilterYear] = useState(() => budgetYear)
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [includeCompletedGoals, setIncludeCompletedGoals] = useState(false)
  const [kpiModal, setKpiModal] = useState<SparingAnalyseKpiKind | null>(null)

  useEffect(() => {
    if (yearOptions.includes(filterYear)) return
    setFilterYear(yearOptions[0] ?? new Date().getFullYear())
  }, [yearOptions, filterYear])

  const filteredGoals = useMemo(
    () =>
      filterSavingsGoalsForAnalyse(
        savingsGoals,
        { excludeCompleted: !includeCompletedGoals },
        transactions,
        budgetCategories,
        activeProfileId,
      ),
    [
      savingsGoals,
      includeCompletedGoals,
      transactions,
      budgetCategories,
      activeProfileId,
    ],
  )

  const kpi = useMemo(
    () =>
      buildAnalyseKpi(filteredGoals, transactions, budgetCategories, activeProfileId),
    [filteredGoals, transactions, budgetCategories, activeProfileId],
  )

  const monthlySeries = useMemo(
    () =>
      buildMonthlySparingActivitySeries(
        filteredGoals,
        transactions,
        budgetCategories,
        activeProfileId,
        filterYear,
        periodMode,
        monthIndex,
      ),
    [
      filteredGoals,
      transactions,
      budgetCategories,
      activeProfileId,
      filterYear,
      periodMode,
      monthIndex,
    ],
  )

  const goalShares = useMemo(
    () =>
      buildGoalShareRows(filteredGoals, transactions, budgetCategories, activeProfileId),
    [filteredGoals, transactions, budgetCategories, activeProfileId],
  )

  const householdRows = useMemo(() => {
    if (!isHouseholdAggregate || profiles.length < 2) return []
    return sumEffectiveSavedBySourceProfile(
      filteredGoals,
      transactions,
      budgetCategories,
      activeProfileId,
      profiles.map((p) => p.id),
    ).map((row) => ({
      ...row,
      name: profiles.find((p) => p.id === row.profileId)?.name ?? row.profileId,
    }))
  }, [
    isHouseholdAggregate,
    profiles,
    filteredGoals,
    transactions,
    budgetCategories,
    activeProfileId,
  ])

  /** Ved én valgt profil: kun den profilen i sparetempo — ikke tomme kort for øvrige medlemmer. */
  const paceProfiles = useMemo(() => {
    if (isHouseholdAggregate) return profiles
    const p = profiles.find((x) => x.id === activeProfileId)
    if (p) return [p]
    return [{ id: activeProfileId, name: activeProfileName }]
  }, [isHouseholdAggregate, profiles, activeProfileId, activeProfileName])

  const householdPaceRows = useMemo(() => {
    if (filteredGoals.length === 0) return []
    return buildHouseholdAnalysePaceRows(
      filteredGoals,
      transactions,
      budgetCategories,
      activeProfileId,
      paceProfiles,
    )
  }, [filteredGoals, transactions, budgetCategories, activeProfileId, paceProfiles])

  const aggregateMonthlyRequired = useMemo(
    () => sumAggregateMonthlyPace(householdPaceRows),
    [householdPaceRows],
  )

  const aggregateWeeklyRequired = useMemo(
    () => sumAggregateWeeklyPace(householdPaceRows),
    [householdPaceRows],
  )

  const hasRequiredPacePlan = useMemo(
    () => householdPaceRows.some((r) => r.pace.status === 'ok'),
    [householdPaceRows],
  )

  const periodLabel = periodSubtitle(periodMode, filterYear, monthIndex)
  const activitySumPeriod = useMemo(() => monthlySeries.reduce((s, p) => s + p.nok, 0), [monthlySeries])

  const showHouseholdChart = householdRows.length >= 2 && householdRows.some((r) => r.effectiveNok > 0)

  const hasGoals = filteredGoals.length > 0

  return (
    <SparingAnalyseTourProvider hasGoals={hasGoals} showHouseholdChart={showHouseholdChart}>
      <div className="flex-1 min-w-0 overflow-auto" style={{ background: 'var(--bg)' }}>
        <Header
          title="Analyse"
          subtitle={
            isHouseholdAggregate
              ? 'Samlet bilde av sparemål og registrert sparingaktivitet i husholdningen'
              : `Sparemål og aktivitet for ${activeProfileName}`
          }
          titleAddon={<SparingAnalyseTourHeaderButton />}
        />
        <div data-sa-tour="subnav">
          <SparingSubnav />
        </div>
      <div
        className="mx-auto w-full min-w-0 max-w-7xl space-y-6 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8 xl:max-w-[90rem]"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div data-sa-tour="period-toolbar" className="min-w-0 shrink">
              <DashboardPeriodToolbar
                variant="inline"
                filterYear={filterYear}
                onFilterYearChange={setFilterYear}
                periodMode={periodMode}
                onPeriodModeChange={setPeriodMode}
                monthIndex={monthIndex}
                onMonthIndexChange={setMonthIndex}
                yearOptions={yearOptions}
              />
            </div>
            <div data-sa-tour="include-completed" className="shrink-0">
              <button
                type="button"
                id={includeCompletedSwitchId}
                role="switch"
                aria-checked={includeCompletedGoals}
                onClick={() => setIncludeCompletedGoals((v) => !v)}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-3 rounded-xl text-left touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <span
                  className="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors"
                  style={{ background: includeCompletedGoals ? 'var(--primary)' : 'var(--border)' }}
                >
                  <span
                    className="mt-1 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: includeCompletedGoals ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                    }}
                  />
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  Inkluder fullførte mål
                </span>
              </button>
            </div>
          </div>
          <div data-sa-tour="intro-copy">
            <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
              Periode: <strong style={{ color: 'var(--text)' }}>{periodLabel}</strong>. KPI og kakediagram viser
              effektiv sparing på målene slik som på sparemål-kortene. Stolpediagrammet viser registrerte
              transaksjoner til koblede kategorier og manuelle innskudd i perioden — ikke bankhistorikk av saldo.
            </p>
          </div>
        </section>

        {filteredGoals.length === 0 ? (
          <div
            data-sa-tour="empty-goals"
            className="rounded-2xl border p-6 text-center text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
          >
            {savingsGoals.length === 0
              ? 'Ingen sparemål ennå — legg til mål under fanen Sparing.'
              : includeCompletedGoals
                ? 'Ingen mål å vise.'
                : 'Alle mål er fullførte med gjeldende filter — slå på «Inkluder fullførte mål» eller legg til nye mål.'}
          </div>
        ) : (
          <>
            <section
              data-sa-tour="kpi-grid"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <StatCard
                label="Totalt spart (effektiv)"
                value={formatNOK(kpi.totalSaved)}
                sub={`Mot målsum ${formatNOK(kpi.totalTarget)} totalt`}
                icon={Wallet}
                color="#495057"
                valueNoWrap
                onClick={() => setKpiModal('totalSaved')}
                aria-label="Totalt spart (effektiv) — åpne forklaring"
              />
              <StatCard
                label="Samlet fremgang"
                value={`${kpi.progressPct} %`}
                sub="Av total målsum for utvalget"
                icon={TrendingUp}
                color="#0CA678"
                valueNoWrap
                onClick={() => setKpiModal('progress')}
                aria-label="Samlet fremgang — åpne forklaring"
              />
              <StatCard
                label="Gjenstår til mål"
                value={formatNOK(kpi.remainingTotalNok)}
                sub="Sum av gjenværende mot hvert mål"
                icon={Target}
                color="#7048E8"
                valueNoWrap
                onClick={() => setKpiModal('remaining')}
                aria-label="Gjenstår til mål — åpne detaljer"
              />
              <StatCard
                label="Aktive mål"
                value={String(kpi.activeCount)}
                sub={`${kpi.completedCount} fullførte i utvalget`}
                icon={PiggyBank}
                color="#F08C00"
                onClick={() => setKpiModal('counts')}
                aria-label="Aktive og fullførte mål — åpne oversikt"
              />
              <StatCard
                label="Aktivitet i perioden"
                value={formatNOK(activitySumPeriod)}
                sub="Sum registrerte innskudd og sparing i valgte måneder"
                icon={BarChart3}
                color={chartPrimary}
                valueNoWrap
                onClick={() => setKpiModal('activity')}
                aria-label="Aktivitet i perioden — åpne månedlig oversikt"
              />
              <StatCard
                label="Månedlig sparekrav (plan)"
                value={hasRequiredPacePlan ? formatNOK(aggregateMonthlyRequired) : '—'}
                sub={
                  hasRequiredPacePlan
                    ? 'Summert lineært tempo mot måldato for mål med aktiv plan'
                    : 'Ingen mål med måldato i fremtiden og gjenværende beløp — sett måldato eller sjekk målene dine.'
                }
                icon={CalendarClock}
                color="#228BE6"
                valueNoWrap
                onClick={() => setKpiModal('requiredPace')}
                aria-label="Månedlig sparekrav (plan) — åpne forklaring"
              />
            </section>

            {kpiModal !== null ? (
              <SparingAnalyseKpiModal
                open
                kind={kpiModal}
                onClose={() => setKpiModal(null)}
                periodLabel={periodLabel}
                kpi={kpi}
                monthlySeries={monthlySeries}
                filteredGoals={filteredGoals}
                transactions={transactions}
                budgetCategories={budgetCategories}
                activeProfileId={activeProfileId}
                activitySumPeriod={activitySumPeriod}
                chartPrimary={chartPrimary}
                aggregateMonthlyNok={aggregateMonthlyRequired}
                aggregateWeeklyNok={aggregateWeeklyRequired}
                householdPaceRows={householdPaceRows}
              />
            ) : null}

            <section data-sa-tour="monthly-activity" className="space-y-3">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                Sparingaktivitet per måned
              </h2>
              <div className="w-full min-w-0 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="min-h-[260px] w-full">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => formatNOK(Number(value ?? 0))}
                        labelFormatter={(label) => `${label} ${filterYear}`}
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          color: 'var(--text)',
                        }}
                      />
                      <Bar dataKey="nok" name="Aktivitet" fill={chartPrimary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section data-sa-tour="goal-distribution" className="space-y-3">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                Fordeling av effektiv sparing mellom mål
              </h2>
              <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
                Effektiv sparing er samme tall som på sparemål-kortene.
              </p>
              <SparingAnalyseGoalDistribution
                goalShares={goalShares}
                filteredGoals={filteredGoals}
                chartPrimary={chartPrimary}
              />
            </section>

            {showHouseholdChart ? (
              <section data-sa-tour="household-chart" className="space-y-3">
                <h2 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--text)' }}>
                  <Users size={18} aria-hidden className="shrink-0" style={{ color: 'var(--primary)' }} />
                  Fordeling i husholdningen (effektiv sparing)
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Summene er samme registrerte sparemål som i enkeltprofilvisning — fordelt på kildeprofil.
                </p>
                <div className="w-full min-w-0 rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height={Math.max(220, householdRows.length * 44)}>
                      <BarChart
                        layout="vertical"
                        data={householdRows}
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                        <YAxis type="category" dataKey="name" width={88} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => formatNOK(Number(value ?? 0))}
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            color: 'var(--text)',
                          }}
                        />
                        <Bar dataKey="effectiveNok" fill={chartPrimary} radius={[0, 4, 4, 0]} name="Spart" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <div
                data-sa-tour="household-pace"
                className="w-full min-w-0 rounded-2xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <SparingAnalyseHouseholdPace
                  paceRows={householdPaceRows}
                  profiles={paceProfiles}
                  chartPrimary={chartPrimary}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
    </SparingAnalyseTourProvider>
  )
}
