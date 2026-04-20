'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { periodSubtitle } from '@/lib/budgetPeriod'
import { useActivePersonFinance, useStore } from '@/lib/store'
import {
  buildStackedBarRows,
  clampTaxPercent,
  computeIncomeSprintDerived,
  computeSourceMonthGrossTaxNet,
  formatIncomeSprintPlanPeriodNb,
  listMonthKeysInRange,
  monthKeyHeadingNb,
  reconcileIncomeSprintPlan,
  smartSpareFilterToReferenceDate,
  yearOptionsTouchingPlan,
  type IncomeSprintPlan,
} from '@/lib/incomeSprint'
import { formatNOK, formatNOKChartLabel, formatThousands, generateId, parseThousands } from '@/lib/utils'
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  Clock,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
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

  const planYearOptions = useMemo(() => (plan ? yearOptionsTouchingPlan(plan) : []), [plan])

  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear())
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())

  const planRef = useRef(plan)
  planRef.current = plan

  useEffect(() => {
    const p = planRef.current
    if (!p) return
    const opts = yearOptionsTouchingPlan(p)
    if (opts.length === 0) return
    const y = new Date().getFullYear()
    setFilterYear(opts.includes(y) ? y : opts[0]!)
  }, [plan?.id, plan?.startDate, plan?.endDate])

  const referenceDate = useMemo(
    () => (plan ? smartSpareFilterToReferenceDate(plan, filterYear, periodMode, monthIndex) : ''),
    [plan, filterYear, periodMode, monthIndex],
  )

  const derived = useMemo(
    () => (plan && referenceDate ? computeIncomeSprintDerived(plan, referenceDate) : null),
    [plan, referenceDate],
  )

  type CellModal = { sourceId: string; monthKey: string }
  const [cellModal, setCellModal] = useState<CellModal | null>(null)
  const [renamingSourceId, setRenamingSourceId] = useState<string | null>(null)
  const [modalAddCustomStr, setModalAddCustomStr] = useState('')

  useEffect(() => {
    if (!cellModal) setModalAddCustomStr('')
  }, [cellModal])

  useEffect(() => {
    if (!cellModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCellModal(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cellModal])

  const cellModalBreakdown = useMemo(() => {
    if (!plan || !cellModal) return null
    return computeSourceMonthGrossTaxNet(plan, cellModal.sourceId, cellModal.monthKey)
  }, [plan, cellModal])

  const cellModalSource = useMemo(
    () => (plan && cellModal ? plan.sources.find((s) => s.id === cellModal.sourceId) ?? null : null),
    [plan, cellModal],
  )

  const suggestedTransferAmount = useMemo(() => {
    if (!cellModalBreakdown || !plan) return 0
    return plan.goalBasis === 'afterTax' ? cellModalBreakdown.net : cellModalBreakdown.gross
  }, [cellModalBreakdown, plan])

  const safePad = 'max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom))'

  const monthKeys = useMemo(() => {
    if (!plan) return []
    return listMonthKeysInRange(plan.startDate, plan.endDate)
  }, [plan])

  /** Standard måned i kildemodal: siste planmåned t.o.m. filtrets referansemåned. */
  const defaultSourceModalMonthKey = useMemo(() => {
    if (monthKeys.length === 0) return ''
    const refMk = derived?.referenceMonthKey ?? monthKeys[monthKeys.length - 1]!
    const eligible = monthKeys.filter((k) => k <= refMk)
    return eligible.length ? eligible[eligible.length - 1]! : monthKeys[0]!
  }, [monthKeys, derived?.referenceMonthKey])

  const barRows = useMemo(() => (plan && monthKeys.length ? buildStackedBarRows(plan, monthKeys) : []), [plan, monthKeys])

  const pieProgress = useMemo(() => {
    if (!derived || derived.targetAmount <= 0) return []
    const achieved = Math.min(derived.targetAmount, derived.paidTotalToDate)
    const left = Math.max(0, derived.targetAmount - achieved)
    return [
      { name: 'Innbetalt', value: achieved, fill: 'var(--primary)' },
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

        {plan && planYearOptions.length > 0 && (
          <div
            className="rounded-2xl p-4 sm:p-5 space-y-2 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Tall per: {periodSubtitle(periodMode, filterYear, monthIndex)}
            </p>
            <p className="text-xs min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
              KPI og «hittil» følger valgt periode (klippet mot plan og dagens dato). Tabellen under viser hele
              planperioden for redigering.
            </p>
            <DashboardPeriodToolbar
              filterYear={filterYear}
              onFilterYearChange={setFilterYear}
              periodMode={periodMode}
              onPeriodModeChange={setPeriodMode}
              monthIndex={monthIndex}
              onMonthIndexChange={setMonthIndex}
              yearOptions={planYearOptions}
            />
          </div>
        )}

        {!derived && (
          <p className="text-sm rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Ingen gyldige måneder i perioden. Sjekk at startdato er før eller samme måned som sluttdato.
          </p>
        )}

        {derived && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
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
                info="Opptjent/forventet fra brutto-tabellen innenfor valgt periode — kan være utbetalt eller ikke."
              />
              <StatCard
                label="Innbetalt hittil"
                value={formatNOK(derived.paidTotalToDate)}
                sub="Månedlige tilføringer + eventuelt engangs (samme målgrunnlag som målet)."
                icon={PiggyBank}
                color="#7048E8"
              />
              <StatCard
                label="Ventende"
                value={formatNOK(derived.pendingNotReceived)}
                sub="Tjent hittil minus innbetalt (min. 0)."
                icon={Clock}
                color="#AE3EC9"
              />
              <StatCard
                label="Resterende"
                value={formatNOK(derived.remaining)}
                sub="Mål minus innbetalt hittil (konservativ fremdrift)."
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
                  Kun faktisk innbetalt mot målbeløp (valgt periode).
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

            <StatCard
              label="Dager til sluttdato"
              value={String(derived.daysLeft)}
              sub="Fra referansedato (filter) til siste dag i planen."
              icon={Calendar}
              color="#4C6EF5"
            />

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                    Brutto per måned
                  </h2>
                  <p className="text-xs mt-1 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                    Trykk på <strong style={{ color: 'var(--text)' }}>kildenavnet</strong> i den blå ruten for innbetalt,
                    brutto/netto og valgfri skatt — velg måned i vinduet. Bruk blyanten for å endre navn. Brutto per måned
                    tastes i cellene til høyre.
                  </p>
                </div>
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
                        <th
                          className="text-left py-2 pr-2 font-medium sticky left-0 z-10 min-w-[8.5rem] sm:min-w-[9.5rem] w-[8.5rem] sm:w-[9.5rem]"
                          style={{ background: 'var(--surface)' }}
                        >
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
                          <td
                            className="py-1 pr-1.5 sticky left-0 z-10 align-middle min-w-0 w-[8.5rem] sm:w-[9.5rem] max-w-[9.5rem]"
                            style={{ background: 'var(--surface)' }}
                          >
                            {(() => {
                              const displayName = src.name.trim() || `Kilde ${si + 1}`
                              const openSourceModal = () => {
                                setRenamingSourceId(null)
                                setCellModal({
                                  sourceId: src.id,
                                  monthKey: defaultSourceModalMonthKey || monthKeys[0]!,
                                })
                              }
                              const isRenaming = renamingSourceId === src.id
                              return (
                                <div
                                  className="flex items-stretch gap-0 min-w-0 rounded-lg border px-0.5 touch-manipulation"
                                  style={{
                                    borderColor: 'var(--primary)',
                                    background: 'var(--primary-pale)',
                                  }}
                                >
                                  {isRenaming && !readOnly ? (
                                    <input
                                      type="text"
                                      autoFocus
                                      value={src.name}
                                      onChange={(e) =>
                                        persistPlan({
                                          ...plan,
                                          sources: plan.sources.map((s) =>
                                            s.id === src.id ? { ...s, name: e.target.value } : s,
                                          ),
                                        })
                                      }
                                      onBlur={() => setRenamingSourceId(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          e.currentTarget.blur()
                                          setRenamingSourceId(null)
                                        }
                                      }}
                                      placeholder={`Kilde ${si + 1}`}
                                      className="flex-1 min-w-0 border-0 bg-transparent font-semibold outline-none focus:ring-0 py-2 px-1 text-[10px] sm:text-sm"
                                      style={{ color: 'var(--text)' }}
                                      aria-label={`Rediger kildenavn ${si + 1}`}
                                    />
                                  ) : readOnly ? (
                                    <span
                                      className="flex-1 min-w-0 font-semibold truncate py-2 px-1 text-[10px] sm:text-sm"
                                      style={{ color: 'var(--text)' }}
                                    >
                                      {displayName}
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={openSourceModal}
                                        className="flex flex-1 min-w-0 items-center text-left font-semibold py-2 px-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation text-[10px] sm:text-sm"
                                        style={{ color: 'var(--text)' }}
                                      >
                                        <span className="break-words line-clamp-2 sm:line-clamp-1 leading-snug">{displayName}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setRenamingSourceId(src.id)
                                        }}
                                        className="inline-flex shrink-0 items-center justify-center py-2 px-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
                                        style={{ color: 'var(--primary)' }}
                                        aria-label={`Endre navn: ${displayName}`}
                                      >
                                        <Pencil size={18} aria-hidden />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )
                            })()}
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
                  Ekstra innbetalt, engangs (kr)
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
                  <span className="text-xs leading-snug break-words">
                    Utenom månedlige tilføringer via kildenavnet i tabellen (åpner vindu). Samme målgrunnlag som målet.
                  </span>
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

            {cellModal && plan && cellModalBreakdown && cellModalSource && (
              <div
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center touch-manipulation"
                style={{ padding: safePad }}
                role="presentation"
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label="Lukk"
                  onPointerDown={(e) => {
                    if (e.target === e.currentTarget) setCellModal(null)
                  }}
                />
                <div
                  className="relative flex max-h-[min(92dvh,36rem)] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden touch-manipulation"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="smartspare-cell-modal-title"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginTop: 'max(0.5rem, env(safe-area-inset-top))',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
                    <h2
                      id="smartspare-cell-modal-title"
                      className="text-lg font-semibold pr-2 min-w-0 break-words"
                      style={{ color: 'var(--text)' }}
                    >
                      {cellModalSource.name.trim() || 'Kilde'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCellModal(null)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl shrink-0 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Lukk"
                    >
                      <X size={22} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 space-y-4 flex-1 min-h-0">
                    <label className="flex flex-col gap-1.5 text-sm min-w-0 font-medium" style={{ color: 'var(--text)' }}>
                      Måned
                      <select
                        value={cellModal.monthKey}
                        onChange={(e) => setCellModal({ ...cellModal, monthKey: e.target.value })}
                        className="min-h-[48px] w-full px-3 py-2.5 rounded-xl text-base sm:text-sm touch-manipulation"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        {monthKeys.map((mk) => (
                          <option key={mk} value={mk}>
                            {monthKeyHeadingNb(mk)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                      Brutto er det du har lagt inn i cellen for valgt måned. Netto følger skattesats (plan eller egen for
                      kilden).
                    </p>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt style={{ color: 'var(--text-muted)' }}>Brutto</dt>
                        <dd className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {formatNOK(cellModalBreakdown.gross)}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: 'var(--text-muted)' }}>Skatt</dt>
                        <dd className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {plan.applyTax ? formatNOK(cellModalBreakdown.tax) : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: 'var(--text-muted)' }}>Netto</dt>
                        <dd className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {plan.applyTax ? formatNOK(cellModalBreakdown.net) : formatNOK(cellModalBreakdown.gross)}
                        </dd>
                      </div>
                    </dl>

                    {plan.applyTax && (
                      <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                        Skatteprosent for denne kilden (tom = planens {plan.taxPercent} %)
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={cellModalSource.taxPercent !== undefined ? cellModalSource.taxPercent : ''}
                          placeholder={String(plan.taxPercent)}
                          onChange={(e) => {
                            const raw = e.target.value
                            persistPlan({
                              ...plan,
                              sources: plan.sources.map((s) => {
                                if (s.id !== cellModalSource.id) return s
                                if (raw.trim() === '') return { ...s, taxPercent: undefined }
                                return { ...s, taxPercent: clampTaxPercent(Number(raw) || 0) }
                              }),
                            })
                          }}
                          className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full sm:w-28 tabular-nums"
                          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                      </label>
                    )}

                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Innbetalt denne måneden (sum):{' '}
                      <strong style={{ color: 'var(--text)' }}>
                        {formatNOK((plan.paidByMonthKey ?? {})[cellModal.monthKey] ?? 0)}
                      </strong>
                    </p>

                    <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                      Annet beløp å tilføye (kr) — tom bruker forslag under
                      <input
                        type="text"
                        inputMode="numeric"
                        value={modalAddCustomStr}
                        onChange={(e) => setModalAddCustomStr(formatThousands(e.target.value))}
                        placeholder={formatThousands(String(suggestedTransferAmount))}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </label>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setCellModal(null)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
                        style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        Lukk
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const add = modalAddCustomStr.trim()
                            ? parseThousands(modalAddCustomStr)
                            : suggestedTransferAmount
                          if (!Number.isFinite(add) || add <= 0) return
                          const mk = cellModal.monthKey
                          const map = plan.paidByMonthKey ?? {}
                          const prev = map[mk] ?? 0
                          persistPlan({
                            ...plan,
                            paidByMonthKey: { ...map, [mk]: prev + add },
                          })
                          setModalAddCustomStr('')
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
                        style={{ background: 'var(--primary)', color: '#fff' }}
                      >
                        Tilfør {formatNOK(modalAddCustomStr.trim() ? parseThousands(modalAddCustomStr) : suggestedTransferAmount)}{' '}
                        til innbetalt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
