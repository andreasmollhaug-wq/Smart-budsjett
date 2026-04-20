'use client'

import { useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'
import { useActivePersonFinance, useStore } from '@/lib/store'
import {
  buildStackedBarRows,
  computeIncomeSprintDerived,
  formatIncomeSprintPlanPeriodNb,
  listMonthKeysInRange,
  monthKeyHeadingNb,
  reconcileIncomeSprintPlan,
  type IncomeSprintPlan,
} from '@/lib/incomeSprint'
import { formatNOK, formatNOKChartLabel, formatThousands, generateId, parseThousands } from '@/lib/utils'
import { AlertTriangle, Calendar, ChevronLeft, PiggyBank, Plus, Target, Trash2, TrendingUp, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const SOURCE_COLORS = ['#3B5BDB', '#0CA678', '#F08C00', '#AE3EC9', '#E03131', '#0B7285', '#7048E8']

type Props = { planId: string }

export default function SmartSparePlanDetail({ planId }: Props) {
  const router = useRouter()
  const people = useStore((s) => s.people)
  const profiles = useStore((s) => s.profiles)
  const {
    incomeSprintPlans,
    upsertIncomeSprintPlan,
    removeIncomeSprintPlan,
    isHouseholdAggregate,
    activeProfileId,
    setActiveProfileId,
    setFinanceScope,
  } = useActivePersonFinance()

  const readOnly = isHouseholdAggregate

  const planExistsSomewhere = useMemo(
    () =>
      profiles.some((p) => (people[p.id]?.incomeSprintPlans ?? []).some((pl) => pl.id === planId)),
    [people, profiles, planId],
  )

  useEffect(() => {
    if (!planExistsSomewhere) return
    const owner = profiles.find((p) =>
      (people[p.id]?.incomeSprintPlans ?? []).some((pl) => pl.id === planId),
    )
    if (owner) {
      setFinanceScope('profile')
      if (owner.id !== activeProfileId) setActiveProfileId(owner.id)
    }
  }, [planId, people, profiles, activeProfileId, setActiveProfileId, setFinanceScope, planExistsSomewhere])

  const plan = useMemo(
    () => incomeSprintPlans.find((p) => p.id === planId) ?? null,
    [incomeSprintPlans, planId],
  )

  const persistPlan = useCallback(
    (next: IncomeSprintPlan) => {
      if (readOnly) return
      upsertIncomeSprintPlan(reconcileIncomeSprintPlan(next))
    },
    [readOnly, upsertIncomeSprintPlan],
  )

  const derived = useMemo(() => (plan ? computeIncomeSprintDerived(plan) : null), [plan])

  const monthKeys = useMemo(() => {
    if (!plan) return []
    return listMonthKeysInRange(plan.startDate, plan.endDate)
  }, [plan])

  const barRows = useMemo(() => (plan && monthKeys.length ? buildStackedBarRows(plan, monthKeys) : []), [plan, monthKeys])

  const pieProgress = useMemo(() => {
    if (!derived || derived.targetAmount <= 0) return []
    const achieved = Math.min(derived.targetAmount, derived.totalTowardGoal)
    const left = Math.max(0, derived.targetAmount - achieved)
    return [
      { name: 'Oppnådd', value: achieved, fill: 'var(--primary)' },
      { name: 'Igjen', value: left, fill: 'var(--border)' },
    ]
  }, [derived])

  const goalSub =
    plan?.goalBasis === 'beforeTax'
      ? 'Beløpet er før skatt — «Tjent hittil» følger brutto.'
      : 'Beløpet er etter skatt — «Tjent hittil» følger netto når skatt er på.'

  const earnedSub =
    plan?.goalBasis === 'beforeTax'
      ? 'Brutto inn til og med inneværende måned i perioden.'
      : plan?.applyTax
        ? 'Netto (etter skatt) til og med inneværende måned.'
        : 'Samme som brutto når skatt er av.'

  const planTitle = plan ? (plan.name?.trim() || formatIncomeSprintPlanPeriodNb(plan)) : ''

  const ownerProfileName = profiles.find((p) => p.id === activeProfileId)?.name ?? ''
  const headerSubtitle =
    planTitle && profiles.length >= 2 ? `${planTitle} · ${ownerProfileName}` : planTitle

  if (!planExistsSomewhere) {
    return (
      <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
        <Header title="smartSpare" subtitle="Plan ikke funnet" />
        <SparingSubnav />
        <div
          className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full min-w-0 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
        >
          <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
            Denne planen finnes ikke (eller er slettet).
          </p>
          <Link
            href="/sparing/smartspare"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium touch-manipulation w-full sm:w-auto"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <ChevronLeft size={18} aria-hidden />
            Til oversikt
          </Link>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
        <Header title="smartSpare" subtitle="Laster …" />
        <SparingSubnav />
        <div
          className="p-6 text-sm pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{
            color: 'var(--text-muted)',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          Laster plan …
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
      <Header title="smartSpare" subtitle={headerSubtitle} />
      <SparingSubnav />
      <div
        className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full min-w-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        <Link
          href="/sparing/smartspare"
          className="inline-flex min-h-[44px] w-full sm:w-auto max-w-full items-center justify-center sm:justify-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium touch-manipulation min-w-0"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <ChevronLeft size={18} className="shrink-0" aria-hidden />
          <span className="min-w-0">Til oversikt</span>
        </Link>

        {readOnly && (
          <div
            className="rounded-2xl p-4 flex gap-3 items-start"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
          >
            <AlertTriangle className="shrink-0 mt-0.5" size={20} style={{ color: 'var(--primary)' }} />
            <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text)' }}>
              Du viser <strong>husholdning</strong>. Bytt til <strong>én profil</strong> (ikke husholdning) for å redigere
              denne planen.
            </p>
          </div>
        )}

        {!derived && (
          <p className="text-sm rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Ingen gyldige måneder i perioden. Sjekk at startdato er før eller samme måned som sluttdato.
          </p>
        )}

        {derived && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Mål"
                value={formatNOK(derived.targetAmount)}
                sub={goalSub}
                icon={Target}
                color="#3B5BDB"
                info="Målbeløpet tolkes i det du valgte under «Målgrunnlag» (før eller etter skatt)."
              />
              <StatCard
                label="Tjent hittil"
                value={
                  plan.goalBasis === 'beforeTax' ? formatNOK(derived.earnedGrossToDate) : formatNOK(derived.earnedNetToDate)
                }
                sub={earnedSub}
                icon={TrendingUp}
                color="#0CA678"
              />
              <StatCard
                label="Innbetalt mot mål"
                value={formatNOK(derived.paidTowardGoal)}
                sub="Manuelt beløp i samme målgrunnlag som målet."
                icon={PiggyBank}
                color="#7048E8"
              />
              <StatCard
                label="Resterende"
                value={formatNOK(derived.remaining)}
                sub="Mål minus innbetaling og «tjent hittil»."
                icon={Wallet}
                color="#F08C00"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
              <div
                className="rounded-2xl p-4 sm:p-5 min-w-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                  Bruttoinntekt per måned
                </h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Fordelt på kilder (stablet).
                </p>
                {barRows.length === 0 || plan.sources.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Legg til minst én kilde for å se diagrammet.
                  </p>
                ) : (
                  <div className="h-[220px] sm:h-[260px] lg:h-[280px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barRows} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
                        <YAxis
                          tickFormatter={(v) => {
                            const n = Number(v)
                            return Number.isFinite(n) && Math.abs(n) >= 1000 ? formatNOKChartLabel(n) : String(v)
                          }}
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                          width={44}
                        />
                        <Tooltip
                          formatter={(value) => formatNOK(Number(value ?? 0))}
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            color: 'var(--text)',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {plan.sources.map((s, i) => (
                          <Bar
                            key={s.id}
                            dataKey={`src_${s.id}`}
                            name={s.name || `Kilde ${i + 1}`}
                            stackId="income"
                            fill={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl p-4 sm:p-5 min-w-0 flex flex-col items-center justify-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold text-sm mb-1 self-start w-full" style={{ color: 'var(--text)' }}>
                  Fremdrift mot mål
                </h3>
                <p className="text-xs mb-2 self-start w-full" style={{ color: 'var(--text-muted)' }}>
                  Innbetalt + tjent hittil (i målgrunnlag) mot målbeløp.
                </p>
                {derived.targetAmount <= 0 ? (
                  <p className="text-sm self-start" style={{ color: 'var(--text-muted)' }}>
                    Sett et målbeløp over null for å se diagrammet.
                  </p>
                ) : (
                  <>
                    <div className="h-[200px] sm:h-[220px] w-full max-w-[280px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieProgress}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={76}
                            paddingAngle={2}
                          >
                            {pieProgress.map((_, i) => (
                              <Cell key={i} fill={pieProgress[i]?.fill} stroke="var(--surface)" strokeWidth={1} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatNOK(Number(v ?? 0))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-sm font-semibold tabular-nums mt-1" style={{ color: 'var(--text)' }}>
                      {Math.round(derived.progressPercent)} % av målet
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                label="Dager til sluttdato"
                value={String(derived.daysLeft)}
                sub="Fra dagens dato til siste dag i perioden."
                icon={Calendar}
                color="#4C6EF5"
              />
              <StatCard
                label="Totalt mot mål"
                value={formatNOK(derived.totalTowardGoal)}
                sub="Innbetalt + tjent hittil (i valgt målgrunnlag)."
                icon={Target}
                color="#0B7285"
              />
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Brutto per måned
                </h2>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    persistPlan({
                      ...plan,
                      sources: [...plan.sources, { id: generateId(), name: `Kilde ${plan.sources.length + 1}`, amountsByMonthKey: {} }],
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50"
                  style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                >
                  <Plus size={18} />
                  Legg til kilde
                </button>
              </div>

              {monthKeys.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Velg gyldig start- og sluttdato.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-1 min-w-0 touch-manipulation">
                  <table className="w-full text-[10px] sm:text-xs border-collapse min-w-[42rem]">
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left py-2 pr-3 font-medium sticky left-0 z-10 min-w-[7rem] sm:min-w-[8rem]" style={{ background: 'var(--surface)' }}>
                          Kilde
                        </th>
                        {monthKeys.map((mk) => (
                          <th
                            key={mk}
                            className="text-right py-2 px-1 font-medium whitespace-nowrap"
                            title={monthKeyHeadingNb(mk)}
                          >
                            <span className="inline-block leading-tight">{monthKeyHeadingNb(mk)}</span>
                          </th>
                        ))}
                        <th className="text-right py-2 pl-2 font-medium w-10" aria-label="Slett" />
                      </tr>
                    </thead>
                    <tbody>
                      {plan.sources.map((src, si) => (
                        <tr key={src.id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                          <td className="py-1.5 pr-2 sticky left-0 z-10 align-middle" style={{ background: 'var(--surface)' }}>
                            <input
                              type="text"
                              disabled={readOnly}
                              value={src.name}
                              onChange={(e) =>
                                persistPlan({
                                  ...plan,
                                  sources: plan.sources.map((s) =>
                                    s.id === src.id ? { ...s, name: e.target.value } : s,
                                  ),
                                })
                              }
                              className="w-full min-w-0 px-2 py-2 rounded-lg text-xs sm:text-sm"
                              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                              aria-label={`Kildenavn ${si + 1}`}
                            />
                          </td>
                          {monthKeys.map((mk) => {
                            const v = src.amountsByMonthKey[mk] ?? 0
                            return (
                              <td key={mk} className="py-1 px-0.5 align-middle">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  disabled={readOnly}
                                  value={v ? formatThousands(String(v)) : ''}
                                  onChange={(e) => {
                                    const n = parseThousands(e.target.value)
                                    persistPlan({
                                      ...plan,
                                      sources: plan.sources.map((s) =>
                                        s.id === src.id
                                          ? { ...s, amountsByMonthKey: { ...s.amountsByMonthKey, [mk]: n } }
                                          : s,
                                      ),
                                    })
                                  }}
                                  className="w-full min-w-[4.25rem] sm:min-w-[4.5rem] px-1 py-2 rounded-lg text-right tabular-nums text-[10px] sm:text-sm"
                                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                  aria-label={`Beløp ${src.name} ${monthKeyHeadingNb(mk)}`}
                                />
                              </td>
                            )
                          })}
                          <td className="py-1 pl-1 align-middle text-right">
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                persistPlan({
                                  ...plan,
                                  sources: plan.sources.filter((s) => s.id !== src.id),
                                })
                              }
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation disabled:opacity-40"
                              style={{ color: 'var(--danger)' }}
                              aria-label={`Slett kilde ${src.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 overflow-x-auto min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Oppsummering (hele perioden)
              </h2>
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[20rem]">
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-2 pr-2 font-medium">Kilde</th>
                    <th className="text-right py-2 px-2 font-medium tabular-nums">Brutto</th>
                    {plan.applyTax && <th className="text-right py-2 px-2 font-medium tabular-nums">Skatt</th>}
                    <th className="text-right py-2 pl-2 font-medium tabular-nums">Netto</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.sourceTotals.map((row) => (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                      <td className="py-2 pr-2">{row.name || '—'}</td>
                      <td className="text-right py-2 px-2 tabular-nums">{formatNOK(row.grossFullPeriod)}</td>
                      {plan.applyTax && (
                        <td className="text-right py-2 px-2 tabular-nums">{formatNOK(row.taxFullPeriod)}</td>
                      )}
                      <td className="text-right py-2 pl-2 tabular-nums">{formatNOK(row.netFullPeriod)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold" style={{ borderTop: '2px solid var(--border)', color: 'var(--text)' }}>
                    <td className="py-2 pr-2">Totalt</td>
                    <td className="text-right py-2 px-2 tabular-nums">{formatNOK(derived.grandGrossFull)}</td>
                    {plan.applyTax && (
                      <td className="text-right py-2 px-2 tabular-nums">{formatNOK(derived.grandTaxFull)}</td>
                    )}
                    <td className="text-right py-2 pl-2 tabular-nums">{formatNOK(derived.grandNetFull)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-4 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 justify-between">
                <h2 className="font-semibold w-full sm:w-auto" style={{ color: 'var(--text)' }}>
                  Innstillinger
                </h2>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (typeof window !== 'undefined' && !window.confirm('Slette denne planen? Dette kan ikke angres.'))
                      return
                    removeIncomeSprintPlan(plan.id)
                    router.push('/sparing/smartspare')
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50 self-start"
                  style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
                >
                  Slett plan
                </button>
              </div>

              <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                Navn på plan (valgfritt)
                <input
                  type="text"
                  disabled={readOnly}
                  value={plan.name ?? ''}
                  onChange={(e) => persistPlan({ ...plan, name: e.target.value })}
                  placeholder={formatIncomeSprintPlanPeriodNb(plan)}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Startdato
                  <input
                    type="date"
                    disabled={readOnly}
                    value={plan.startDate}
                    onChange={(e) => persistPlan({ ...plan, startDate: e.target.value })}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Sluttdato
                  <input
                    type="date"
                    disabled={readOnly}
                    value={plan.endDate}
                    onChange={(e) => persistPlan({ ...plan, endDate: e.target.value })}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
              </div>

              <fieldset className="space-y-2 border-0 p-0 m-0">
                <legend className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Målgrunnlag
                </legend>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name={`smartspare-detail-goal-${planId}`}
                      disabled={readOnly}
                      checked={plan.goalBasis === 'afterTax'}
                      onChange={() => persistPlan({ ...plan, goalBasis: 'afterTax' })}
                      className="shrink-0"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Mål etter skatt
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name={`smartspare-detail-goal-${planId}`}
                      disabled={readOnly}
                      checked={plan.goalBasis === 'beforeTax'}
                      onChange={() => persistPlan({ ...plan, goalBasis: 'beforeTax' })}
                      className="shrink-0"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Mål før skatt
                    </span>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Målbeløp (kr)
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={readOnly}
                    value={formatThousands(String(plan.targetAmount || ''))}
                    onChange={(e) =>
                      persistPlan({ ...plan, targetAmount: parseThousands(e.target.value) })
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Innbetalt mot mål (kr)
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={readOnly}
                    value={formatThousands(String(plan.paidTowardGoal || ''))}
                    onChange={(e) =>
                      persistPlan({ ...plan, paidTowardGoal: parseThousands(e.target.value) })
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                <label className="inline-flex items-center gap-3 min-h-[44px] touch-manipulation cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={plan.applyTax}
                    onChange={(e) => persistPlan({ ...plan, applyTax: e.target.checked })}
                    className="shrink-0 w-5 h-5"
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    Trekk skatt av inntekten i tabellen
                  </span>
                </label>
                {plan.applyTax && (
                  <label className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2 min-w-0">
                    <span style={{ color: 'var(--text-muted)' }}>Skatteprosent</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={readOnly}
                      value={plan.taxPercent}
                      onChange={(e) =>
                        persistPlan({ ...plan, taxPercent: Number(e.target.value) || 0 })
                      }
                      className="min-h-[44px] px-3 py-2 rounded-xl w-full sm:w-24 text-base sm:text-sm tabular-nums"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </label>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
