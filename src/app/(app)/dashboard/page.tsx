'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useAppUser } from '@/components/app/AppUserContext'
import { mergeBudgetCategoriesFromSnapshots, useActivePersonFinance, useStore } from '@/lib/store'
import {
  buildBudgetVsActualForPeriod,
  buildDashboardSixMonthIncomeExpense,
  buildMonthlyNetSeriesForPeriod,
  referenceMonthIndexForBudgetYear,
  sumTransactionsByCategoryForMonthRange,
} from '@/lib/bankReportData'
import {
  buildDashboardCheckHints,
  buildSavingsRateTrendForPeriod,
  computeSavingsRatePercent,
  countMonthsWithAnyTransaction,
  summarizeBudgetVsRows,
  sumIncomeExpenseInMonthRange,
  transactionInMonthRange,
} from '@/lib/dashboardOverviewHelpers'
import { summarizeFixedVariableExpenseActuals } from '@/lib/dashboardFixedVariableActuals'
import { buildHouseholdPeriodData } from '@/lib/householdDashboardData'
import {
  buildServiceSubscriptionMonthlyCostForPeriod,
  rollupServiceSubscriptionsCostForPeriod,
} from '@/lib/serviceSubscriptionPeriodRollup'
import { getTotalEffectiveSaved } from '@/lib/savingsDerived'
import { formatNOK } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, ChevronRight } from 'lucide-react'
import DashboardInvestmentsModal from '@/components/dashboard/DashboardInvestmentsModal'
import DashboardSavingsGoalsModal from '@/components/dashboard/DashboardSavingsGoalsModal'
import DashboardCategoryExpenseModal from '@/components/dashboard/DashboardCategoryExpenseModal'
import DashboardIncomeExpenseMonthlyModal from '@/components/dashboard/DashboardIncomeExpenseMonthlyModal'
import DashboardFixedExpensesModal from '@/components/dashboard/DashboardFixedExpensesModal'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import DashboardVsBudgetCard from '@/components/dashboard/DashboardVsBudgetCard'
import DashboardChecksCard from '@/components/dashboard/DashboardChecksCard'
import DashboardRecentActivityCard from '@/components/dashboard/DashboardRecentActivityCard'
import DashboardFixedOutgoingCard from '@/components/dashboard/DashboardFixedOutgoingCard'
import DashboardFixedVariableCard from '@/components/dashboard/DashboardFixedVariableCard'
import DashboardServiceSubscriptionsPeriodCard from '@/components/dashboard/DashboardServiceSubscriptionsPeriodCard'
import DashboardHouseholdSnapshotCard from '@/components/dashboard/DashboardHouseholdSnapshotCard'
import DashboardNetBudgetPeriodSection from '@/components/dashboard/DashboardNetBudgetPeriodSection'
import DashboardTopBudgetedExpenseCategoriesCard from '@/components/dashboard/DashboardTopBudgetedExpenseCategoriesCard'
import DashboardParentBudgetProgressCard from '@/components/dashboard/DashboardParentBudgetProgressCard'
import DashboardSavingsRateCard from '@/components/dashboard/DashboardSavingsRateCard'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { periodRange, periodSubtitle } from '@/lib/budgetPeriod'
import { transactionOnOrBeforeToday } from '@/lib/transactionPeriodFilter'

const DashboardIncomeExpenseChart = dynamic(
  () => import('@/components/dashboard/DashboardIncomeExpenseChart'),
  {
    loading: () => (
      <div className="h-[220px] w-full animate-pulse rounded-xl" style={{ background: 'var(--bg)' }} />
    ),
  },
)

function welcomeTitle(displayName: string, isFirstAppState: boolean): string {
  const base = isFirstAppState ? 'Velkommen' : 'Velkommen tilbake'
  const name = displayName.trim()
  return name ? `${base}, ${name}` : base
}

function dashboardSubtitle(
  isHouseholdAggregate: boolean,
  activeProfileId: string,
  profiles: { id: string; name: string }[],
): string {
  if (isHouseholdAggregate) {
    return 'Oversikt · Samlet husholdning — alle profiler'
  }
  const profileName = profiles.find((p) => p.id === activeProfileId)?.name?.trim()
  if (profileName) {
    return `Oversikt · ${profileName} — din økonomiske oversikt i dag`
  }
  return 'Oversikt · Din økonomiske oversikt i dag'
}

function transaksjonerPeriodHref(year: number, mode: PeriodMode, monthIndex: number): string {
  if (mode === 'month') return `/transaksjoner?year=${year}&month=${monthIndex}`
  if (mode === 'ytd') return `/transaksjoner?year=${year}&month=ytd`
  return `/transaksjoner?year=${year}&month=all`
}

export default function DashboardPage() {
  const { displayName, isFirstAppState } = useAppUser()
  const {
    budgetCategories,
    savingsGoals,
    debts,
    investments,
    transactions,
    isHouseholdAggregate,
    activeProfileId,
    budgetYear,
    profiles,
    archivedBudgetsByYear,
    serviceSubscriptions,
  } = useActivePersonFinance()

  const people = useStore((s) => s.people)

  const [investmentsModalOpen, setInvestmentsModalOpen] = useState(false)
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [categoryModal, setCategoryModal] = useState<{ category: string; total: number } | null>(null)
  const [kpiModal, setKpiModal] = useState<'income' | 'expense' | null>(null)
  const [fixedExpensesModalOpen, setFixedExpensesModalOpen] = useState(false)

  const [filterYear, setFilterYear] = useState(budgetYear)
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [monthIndex, setMonthIndex] = useState(() => referenceMonthIndexForBudgetYear(budgetYear))

  useEffect(() => {
    setFilterYear(budgetYear)
  }, [budgetYear])

  useEffect(() => {
    setMonthIndex(referenceMonthIndexForBudgetYear(filterYear))
  }, [filterYear])

  const yearOptions = useMemo(() => {
    const y = new Set<number>([budgetYear, filterYear])
    for (const t of transactions ?? []) {
      const d = t.date
      if (typeof d !== 'string' || d.length < 4) continue
      const yy = Number.parseInt(d.slice(0, 4), 10)
      if (Number.isFinite(yy)) y.add(yy)
    }
    for (const k of Object.keys(archivedBudgetsByYear)) {
      const n = Number(k)
      if (Number.isFinite(n)) y.add(n)
    }
    return [...y].sort((a, b) => b - a)
  }, [budgetYear, filterYear, transactions, archivedBudgetsByYear])

  const displayCategories = useMemo(() => {
    if (filterYear === budgetYear) return budgetCategories
    const snap = archivedBudgetsByYear[String(filterYear)]
    if (!snap) return []
    if (isHouseholdAggregate) {
      return mergeBudgetCategoriesFromSnapshots(snap, profiles.map((p) => p.id))
    }
    return snap[activeProfileId] ?? []
  }, [
    filterYear,
    budgetYear,
    budgetCategories,
    archivedBudgetsByYear,
    isHouseholdAggregate,
    profiles,
    activeProfileId,
  ])

  const { start, end } = useMemo(() => periodRange(periodMode, monthIndex), [periodMode, monthIndex])

  const periodLabel = useMemo(() => periodSubtitle(periodMode, filterYear, monthIndex), [periodMode, filterYear, monthIndex])

  const periodIncomeExpense = useMemo(
    () => sumIncomeExpenseInMonthRange(transactions ?? [], filterYear, start, end, people),
    [transactions, filterYear, start, end, people],
  )

  const monthTotals = useMemo(
    () => sumTransactionsByCategoryForMonthRange(transactions ?? [], filterYear, start, end, people),
    [transactions, filterYear, start, end, people],
  )

  const budgetVsRows = useMemo(
    () => buildBudgetVsActualForPeriod(displayCategories, monthTotals, start, end),
    [displayCategories, monthTotals, start, end],
  )

  const vsSummary = useMemo(() => summarizeBudgetVsRows(budgetVsRows), [budgetVsRows])

  const coverage = useMemo(
    () => countMonthsWithAnyTransaction(transactions ?? [], filterYear, start, end),
    [transactions, filterYear, start, end],
  )

  const checkHints = useMemo(
    () =>
      buildDashboardCheckHints({
        transactions: transactions ?? [],
        filterYear,
        start,
        end,
      }),
    [transactions, filterYear, start, end],
  )

  const topExpenseCategories = useMemo(() => {
    const byCat = new Map<string, { total: number; count: number }>()
    for (const t of transactions ?? []) {
      if (t.type !== 'expense') continue
      if (!transactionInMonthRange(t, filterYear, start, end)) continue
      const amt = typeof t.amount === 'number' && Number.isFinite(t.amount) ? t.amount : 0
      const cat = typeof t.category === 'string' && t.category.trim() ? t.category.trim() : 'Uten kategori'
      const cur = byCat.get(cat) ?? { total: 0, count: 0 }
      cur.total += amt
      cur.count += 1
      byCat.set(cat, cur)
    }
    return [...byCat.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [transactions, filterYear, start, end])

  const recentInPeriod = useMemo(() => {
    return (transactions ?? []).filter(
      (t) =>
        transactionInMonthRange(t, filterYear, start, end) &&
        typeof t.date === 'string' &&
        transactionOnOrBeforeToday(t),
    )
  }, [transactions, filterYear, start, end])

  const totalDebt = debts.reduce((a, b) => a + b.remainingAmount, 0)
  const totalInvested = investments.reduce((a, b) => a + b.currentValue, 0)
  const totalSaved = useMemo(
    () => getTotalEffectiveSaved(savingsGoals, transactions, budgetCategories, activeProfileId),
    [savingsGoals, transactions, budgetCategories, activeProfileId],
  )

  const portfolio = useMemo(() => {
    const totalPurchase = investments.reduce((a, b) => a + b.purchaseValue, 0)
    const totalGain = investments.reduce((a, b) => a + (b.currentValue - b.purchaseValue), 0)
    const gainPct = totalPurchase !== 0 ? (totalGain / totalPurchase) * 100 : 0
    return { totalPurchase, totalGain, gainPct }
  }, [investments])

  const incomeExpenseChartData = useMemo(
    () => buildDashboardSixMonthIncomeExpense(transactions, budgetYear, people),
    [transactions, budgetYear, people],
  )

  const invGainUp = portfolio.totalGain >= 0

  const serviceSubscriptionLine = useMemo(() => {
    const active = serviceSubscriptions.filter((s) => s.active)
    if (active.length === 0) return null
    let monthlySumNok = 0
    for (const s of active) {
      monthlySumNok += s.billing === 'yearly' ? s.amountNok / 12 : s.amountNok
    }
    return { count: active.length, monthlySumNok }
  }, [serviceSubscriptions])

  const subscriptionPeriodRollup = useMemo(
    () => rollupServiceSubscriptionsCostForPeriod(serviceSubscriptions, filterYear, start, end),
    [serviceSubscriptions, filterYear, start, end],
  )

  const subscriptionMonthly = useMemo(
    () => buildServiceSubscriptionMonthlyCostForPeriod(serviceSubscriptions, filterYear, start, end),
    [serviceSubscriptions, filterYear, start, end],
  )

  const fixedVariableActuals = useMemo(
    () =>
      summarizeFixedVariableExpenseActuals(
        transactions ?? [],
        filterYear,
        start,
        end,
        displayCategories,
      ),
    [transactions, filterYear, start, end, displayCategories],
  )

  const yoyCompare = useMemo(() => {
    const prevYear = filterYear - 1
    const prev = sumIncomeExpenseInMonthRange(transactions ?? [], prevYear, start, end, people)
    const hasPrevData = prev.income > 0 || prev.expense > 0
    return { prevYear, prevIncome: prev.income, prevExpense: prev.expense, hasPrevData }
  }, [transactions, filterYear, start, end, people])

  const savingsRatePct = useMemo(
    () => computeSavingsRatePercent(periodIncomeExpense.income, periodIncomeExpense.expense),
    [periodIncomeExpense.income, periodIncomeExpense.expense],
  )

  const savingsRateTrend = useMemo(
    () => buildSavingsRateTrendForPeriod(transactions ?? [], filterYear, start, end, people),
    [transactions, filterYear, start, end, people],
  )

  const householdPeriod = useMemo(() => {
    if (!isHouseholdAggregate) return null
    return buildHouseholdPeriodData(
      people,
      archivedBudgetsByYear,
      profiles,
      budgetYear,
      filterYear,
      start,
      end,
      transactions ?? [],
    )
  }, [
    isHouseholdAggregate,
    people,
    archivedBudgetsByYear,
    profiles,
    budgetYear,
    filterYear,
    start,
    end,
    transactions,
  ])

  const netBudgetChartSeries = useMemo(
    () =>
      displayCategories.length > 0
        ? buildMonthlyNetSeriesForPeriod(
            transactions ?? [],
            filterYear,
            displayCategories,
            start,
            end,
            people,
          )
        : [],
    [transactions, filterYear, displayCategories, start, end, people],
  )

  const transaksjonerHref = transaksjonerPeriodHref(filterYear, periodMode, monthIndex)

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title={welcomeTitle(displayName, isFirstAppState)}
        subtitle={dashboardSubtitle(isHouseholdAggregate, activeProfileId, profiles)}
      />
      <div className="space-y-6 px-4 py-6 md:p-8">
        <DashboardPeriodToolbar
          filterYear={filterYear}
          onFilterYearChange={setFilterYear}
          periodMode={periodMode}
          onPeriodModeChange={setPeriodMode}
          monthIndex={monthIndex}
          onMonthIndexChange={setMonthIndex}
          yearOptions={yearOptions}
        />

        {filterYear !== budgetYear && (
          <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-muted)' }}>
            Du filtrerer på <strong style={{ color: 'var(--text)' }}>{filterYear}</strong>. Aktivt budsjettår i appen er{' '}
            <strong style={{ color: 'var(--text)' }}>{budgetYear}</strong> (bl.a. trendgrafen nedenfor).{' '}
            <Link href="/budsjett" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--primary)' }}>
              Bytt aktivt budsjettår
            </Link>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="Inntekt"
            value={formatNOK(periodIncomeExpense.income)}
            sub={periodLabel}
            icon={Wallet}
            trend="up"
            color="#3B5BDB"
            onClick={() => setKpiModal('income')}
            aria-label="Se inntekt per måned"
          />
          <StatCard
            label="Utgifter"
            value={formatNOK(periodIncomeExpense.expense)}
            sub={periodLabel}
            icon={TrendingDown}
            trend="down"
            color="#E03131"
            onClick={() => setKpiModal('expense')}
            aria-label="Se utgifter per måned"
          />
          <StatCard label="Total gjeld" value={formatNOK(totalDebt)} sub="Alle lån samlet · per i dag" icon={CreditCard} color="#F08C00" />
          <StatCard
            label="Investeringer"
            value={formatNOK(totalInvested)}
            sub="Markedsverdi i dag"
            icon={TrendingUp}
            trend="up"
            color="#0CA678"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="min-w-0 lg:col-span-2 rounded-2xl p-4 sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Inntekt vs. utgifter (6 mnd)
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Grønn linje viser netto (inntekt minus utgift) per måned. Basert på transaksjoner i budsjettår {budgetYear}{' '}
              (siste inntil seks måneder fram til inneværende måned).
              {filterYear !== budgetYear ? (
                <>
                  {' '}
                  Uavhengig av periodefilter over — viser trend for aktivt budsjettår.
                </>
              ) : null}
            </p>
            <DashboardIncomeExpenseChart data={incomeExpenseChartData} />
          </div>

          <div
            className="flex min-w-0 flex-col rounded-2xl p-4 sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Topp 10 utgifter
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Summert per kategori · {periodLabel}
            </p>
            {topExpenseCategories.length === 0 ? (
              <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
                Ingen utgifter i perioden ennå.
              </p>
            ) : (
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto max-h-[280px]">
                {topExpenseCategories.map((row) => (
                  <button
                    key={row.category}
                    type="button"
                    onClick={() => setCategoryModal({ category: row.category, total: row.total })}
                    className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl p-3 text-left outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation"
                    style={{ background: 'var(--bg)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                        {row.category}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {row.count} {row.count === 1 ? 'transaksjon' : 'transaksjoner'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--danger)' }}>
                      -{formatNOK(row.total)}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <Link
              href={transaksjonerHref}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
              style={{ color: 'var(--primary)' }}
            >
              Se alle transaksjoner
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setInvestmentsModalOpen(true)}
            className="rounded-2xl p-4 text-left outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Investeringer
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {investments.length === 0
                    ? 'Ingen posisjoner'
                    : `${investments.length} ${investments.length === 1 ? 'posisjon' : 'posisjoner'}`}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#0CA67820' }}
              >
                <TrendingUp size={20} style={{ color: '#0CA678' }} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-4" style={{ color: 'var(--text)' }}>
              {formatNOK(totalInvested)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Markedsverdi samlet
            </p>
            {investments.length > 0 && (
              <p className="text-sm mt-3 font-medium" style={{ color: invGainUp ? 'var(--success)' : 'var(--danger)' }}>
                {invGainUp ? '+' : ''}
                {formatNOK(portfolio.totalGain)} ({invGainUp ? '+' : ''}
                {portfolio.gainPct.toFixed(1)}%)
              </p>
            )}
            <p className="text-sm mt-4 font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              Se detaljer
              <ChevronRight size={16} />
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSavingsModalOpen(true)}
            className="rounded-2xl p-4 text-left outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Sparemål
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {savingsGoals.length === 0
                    ? 'Ingen mål'
                    : `${savingsGoals.length} ${savingsGoals.length === 1 ? 'mål' : 'mål'}`}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--primary-pale)' }}
              >
                <PiggyBank size={20} style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-4" style={{ color: 'var(--text)' }}>
              {formatNOK(totalSaved)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Spart totalt
            </p>
            <p className="text-sm mt-4 font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              Se detaljer
              <ChevronRight size={16} />
            </p>
          </button>
        </div>

        <div className="w-full space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div className="min-w-0 space-y-6">
              {displayCategories.length > 0 ? (
                <DashboardVsBudgetCard
                  periodLabel={periodLabel}
                  filterYear={filterYear}
                  periodMode={periodMode}
                  monthIndex={monthIndex}
                  summary={vsSummary}
                  coverage={coverage}
                  yoy={{
                    prevYear: yoyCompare.prevYear,
                    prevIncome: yoyCompare.prevIncome,
                    prevExpense: yoyCompare.prevExpense,
                    hasPrevData: yoyCompare.hasPrevData,
                  }}
                />
              ) : (
                <div
                  className="rounded-2xl p-6 text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Ingen budsjettdata for {filterYear}. Velg aktivt budsjettår eller et år med arkiv.
                </div>
              )}
            </div>

            <div className="min-w-0">
              <DashboardRecentActivityCard
                transactions={recentInPeriod}
                profiles={profiles}
                activeProfileId={activeProfileId}
                isHouseholdAggregate={isHouseholdAggregate}
                transaksjonerHref={transaksjonerHref}
              />
            </div>
          </div>

          {displayCategories.length > 0 ? (
            <div className="grid min-w-0 w-full grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6 xl:gap-8 2xl:gap-10 lg:items-stretch">
              <DashboardFixedOutgoingCard
                budgetCategories={displayCategories}
                endMonthIndex={end}
                onOpenDetails={() => setFixedExpensesModalOpen(true)}
                serviceSubscriptionLine={serviceSubscriptionLine}
              />
              <DashboardSavingsRateCard
                periodLabel={periodLabel}
                aggregateRatePct={savingsRatePct}
                trend={savingsRateTrend}
              />
              <DashboardServiceSubscriptionsPeriodCard
                periodLabel={periodLabel}
                totalNok={subscriptionPeriodRollup.totalNok}
                uniqueCount={subscriptionPeriodRollup.uniqueIdsInPeriod}
                monthly={subscriptionMonthly}
              />
            </div>
          ) : (
            <div className="grid min-w-0 w-full grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10 lg:items-stretch">
              <DashboardSavingsRateCard
                periodLabel={periodLabel}
                aggregateRatePct={savingsRatePct}
                trend={savingsRateTrend}
              />
              <DashboardServiceSubscriptionsPeriodCard
                periodLabel={periodLabel}
                totalNok={subscriptionPeriodRollup.totalNok}
                uniqueCount={subscriptionPeriodRollup.uniqueIdsInPeriod}
                monthly={subscriptionMonthly}
              />
            </div>
          )}

          {checkHints.length > 0 ? (
            <div className="min-w-0">
              <DashboardChecksCard items={checkHints} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:gap-8">
          <DashboardFixedVariableCard
            fixed={fixedVariableActuals.fixed}
            variable={fixedVariableActuals.variable}
            periodLabel={periodLabel}
          />
          {householdPeriod && isHouseholdAggregate ? (
            <DashboardHouseholdSnapshotCard members={householdPeriod.members} periodLabel={periodLabel} />
          ) : null}
        </div>

        {displayCategories.length > 0 ? (
          <>
            <div className="grid min-w-0 w-full grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-6">
              <DashboardNetBudgetPeriodSection
                periodLabel={periodLabel}
                summary={vsSummary}
                chartSeries={netBudgetChartSeries}
                budgetVsRows={budgetVsRows}
                periodMode={periodMode}
                filterYear={filterYear}
                monthIndex={monthIndex}
                onSelectExpenseCategory={(name, actual) => setCategoryModal({ category: name, total: actual })}
              />
              <DashboardTopBudgetedExpenseCategoriesCard
                periodLabel={periodLabel}
                rows={budgetVsRows}
                onSelectCategory={(name, actual) => setCategoryModal({ category: name, total: actual })}
              />
            </div>
            <div className="grid min-w-0 w-full grid-cols-1 lg:grid-cols-3 lg:gap-6 xl:gap-8 2xl:gap-10 lg:items-start">
              <div className="min-w-0">
                <DashboardParentBudgetProgressCard
                  periodLabel={periodLabel}
                  budgetVsRows={budgetVsRows}
                  summary={vsSummary}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <DashboardInvestmentsModal
        open={investmentsModalOpen}
        onClose={() => setInvestmentsModalOpen(false)}
        investments={investments}
      />
      {categoryModal && (
        <DashboardCategoryExpenseModal
          open
          onClose={() => setCategoryModal(null)}
          categoryName={categoryModal.category}
          yearTotal={categoryModal.total}
          budgetYear={filterYear}
          transactions={transactions ?? []}
          budgetCategories={displayCategories}
          profiles={profiles}
          isHouseholdAggregate={isHouseholdAggregate}
          periodHighlightLabel={periodLabel}
          focusMonthRange={{ start, end }}
          periodMode={periodMode}
          monthIndex={monthIndex}
        />
      )}
      <DashboardIncomeExpenseMonthlyModal
        open={kpiModal !== null}
        onClose={() => setKpiModal(null)}
        mode={kpiModal ?? 'income'}
        budgetYear={filterYear}
        transactions={transactions ?? []}
        budgetCategories={displayCategories}
        focusMonthRange={{ start, end }}
      />
      <DashboardSavingsGoalsModal
        open={savingsModalOpen}
        onClose={() => setSavingsModalOpen(false)}
        savingsGoals={savingsGoals}
        transactions={transactions}
        budgetCategories={budgetCategories}
        activeProfileId={activeProfileId}
      />
      <DashboardFixedExpensesModal
        open={fixedExpensesModalOpen}
        onClose={() => setFixedExpensesModalOpen(false)}
        budgetYear={filterYear}
        budgetCategories={displayCategories}
      />
    </div>
  )
}
