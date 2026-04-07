'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Header from '@/components/layout/Header'
import BudgetDashboardMonthlyChart from '@/components/budget/BudgetDashboardMonthlyChart'
import BudgetVsActualTables from '@/components/budget/BudgetVsActualTables'
import BudsjettSubnav from '@/components/budget/BudsjettSubnav'
import TopExpenseCategoriesTable from '@/components/budget/TopExpenseCategoriesTable'
import StatCard from '@/components/ui/StatCard'
import {
  buildBudgetVsActualForPeriod,
  buildMonthlyBudgetActualSeries,
  groupBudgetVsActualByParent,
  sumTransactionsByCategoryForMonthRange,
} from '@/lib/bankReportData'
import { downloadBudgetVsCsv } from '@/lib/budgetDashboardCsv'
import { transactionsHrefForCategory } from '@/lib/budgetDashboardLinks'
import {
  BUDGET_MONTH_LABELS,
  periodHelpText,
  periodRange,
  periodSubtitle,
  type PeriodMode,
} from '@/lib/budgetPeriod'
import { mergeBudgetCategoriesFromSnapshots, useActivePersonFinance } from '@/lib/store'
import { formatNOK } from '@/lib/utils'
import { AlertTriangle, Download, Scale, TrendingDown, Wallet } from 'lucide-react'

export default function BudsjettDashboardPage() {
  const {
    transactions,
    budgetCategories,
    budgetYear,
    archivedBudgetsByYear,
    profiles,
    activeProfileId,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const [year, setYear] = useState(budgetYear)
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month')

  useEffect(() => {
    setYear(budgetYear)
  }, [budgetYear])

  /** Samme kilde som budsjett-siden: aktivt år = nåværende kategorier, annet år = arkiv eller tomt. */
  const displayCategories = useMemo(() => {
    if (year === budgetYear) return budgetCategories
    const snap = archivedBudgetsByYear[String(year)]
    if (!snap) return []
    if (isHouseholdAggregate) {
      return mergeBudgetCategoriesFromSnapshots(snap, profiles.map((p) => p.id))
    }
    return snap[activeProfileId] ?? []
  }, [
    year,
    budgetYear,
    budgetCategories,
    archivedBudgetsByYear,
    isHouseholdAggregate,
    profiles,
    activeProfileId,
  ])

  const { start, end } = useMemo(() => periodRange(periodMode, monthIndex), [periodMode, monthIndex])

  const monthTotals = useMemo(
    () => sumTransactionsByCategoryForMonthRange(transactions, year, start, end),
    [transactions, year, start, end],
  )

  const budgetVsRows = useMemo(
    () => buildBudgetVsActualForPeriod(displayCategories, monthTotals, start, end),
    [displayCategories, monthTotals, start, end],
  )

  const budgetVsByParent = useMemo(() => groupBudgetVsActualByParent(budgetVsRows), [budgetVsRows])

  const dashboardKpis = useMemo(() => {
    let budgetedIncome = 0
    let budgetedExpense = 0
    let actualIncome = 0
    let actualExpense = 0
    let badCount = 0
    for (const r of budgetVsRows) {
      if (r.type === 'income') {
        budgetedIncome += r.budgeted
        actualIncome += r.actual
        if (r.variance < 0) badCount++
      } else {
        budgetedExpense += r.budgeted
        actualExpense += r.actual
        if (r.variance > 0) badCount++
      }
    }
    const budgetNet = budgetedIncome - budgetedExpense
    const actualNet = actualIncome - actualExpense
    const varianceNet = actualNet - budgetNet
    return {
      budgetedIncome,
      budgetedExpense,
      actualIncome,
      actualExpense,
      budgetNet,
      actualNet,
      varianceNet,
      badCount,
    }
  }, [budgetVsRows])

  const monthlySeries = useMemo(
    () => buildMonthlyBudgetActualSeries(transactions, year, displayCategories),
    [transactions, year, displayCategories],
  )

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    const window = Array.from({ length: 11 }, (_, i) => y - 5 + i)
    const set = new Set<number>([budgetYear, year, ...Object.keys(archivedBudgetsByYear).map(Number), ...window])
    return [...set].sort((a, b) => b - a)
  }, [budgetYear, archivedBudgetsByYear, year])

  const subtitle = periodSubtitle(periodMode, year, monthIndex)
  const helpIngress = periodHelpText(periodMode)

  const linkHrefForCategory = useCallback(
    (name: string) => transactionsHrefForCategory(periodMode, year, monthIndex, name),
    [periodMode, year, monthIndex],
  )

  const kpiSub = `${subtitle} (samme periode som tabellene)`

  const cardStyle: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
  }

  const handleExportCsv = () => {
    downloadBudgetVsCsv(budgetVsRows, { periodLabel: subtitle, year })
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header title="Budsjett" subtitle={`Budsjett dashboard · ${subtitle}`} />
      <BudsjettSubnav />
      <div className="p-4 sm:p-6 lg:px-8 lg:py-8 xl:px-10 space-y-4 sm:space-y-6 flex-1 w-full min-w-0">
        <p
          className="text-xs sm:text-sm lg:hidden rounded-xl px-3 py-2"
          style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          Tip: Tabeller og full oversikt er enklest på nettbrett eller PC — på mobil kan du sveipe sideveis i tabellene.
        </p>

        <div className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-3">
            <label className="flex flex-col gap-1.5 text-sm w-full sm:w-auto min-w-0" style={{ color: 'var(--text-muted)' }}>
              <span>Periode</span>
              <select
                value={periodMode}
                onChange={(e) => setPeriodMode(e.target.value as PeriodMode)}
                className="w-full sm:w-auto sm:min-w-[11rem] min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="month">Én måned</option>
                <option value="ytd">Hittil i år (YTD)</option>
                <option value="year">Hele året</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm w-full sm:w-auto min-w-0" style={{ color: 'var(--text-muted)' }}>
              <span>År</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full sm:w-auto min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            {periodMode !== 'year' && (
              <label className="flex flex-col gap-1.5 text-sm w-full sm:w-auto min-w-0" style={{ color: 'var(--text-muted)' }}>
                <span>{periodMode === 'ytd' ? 'Til og med måned' : 'Måned'}</span>
                <select
                  value={monthIndex}
                  onChange={(e) => setMonthIndex(Number(e.target.value))}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2.5 rounded-xl text-base sm:text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  {BUDGET_MONTH_LABELS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex-1 min-w-0 sm:flex sm:justify-end sm:items-end">
              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <Download size={18} aria-hidden />
                Last ned CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Faktisk netto"
            value={formatNOK(dashboardKpis.actualNet)}
            sub={kpiSub}
            icon={Wallet}
            trend={dashboardKpis.actualNet >= 0 ? 'up' : 'down'}
            color={dashboardKpis.actualNet >= 0 ? '#0CA678' : '#E03131'}
            info="Inntekter minus utgifter (faktisk) for valgt periode, summert over alle budsjettlinjer."
          />
          <StatCard
            label="Budsjettert netto"
            value={formatNOK(dashboardKpis.budgetNet)}
            sub={kpiSub}
            icon={Scale}
            trend={dashboardKpis.budgetNet >= 0 ? 'up' : 'down'}
            color={dashboardKpis.budgetNet >= 0 ? '#3B5BDB' : '#E03131'}
            info="Inntekter minus utgifter (budsjettert) for samme periode."
          />
          <StatCard
            label="Netto avvik"
            value={formatNOK(dashboardKpis.varianceNet)}
            sub={kpiSub}
            icon={TrendingDown}
            trend={dashboardKpis.varianceNet >= 0 ? 'up' : 'down'}
            color={dashboardKpis.varianceNet >= 0 ? '#0CA678' : '#E03131'}
            info="Faktisk netto minus budsjettert netto. Positivt betyr bedre enn budsjett."
          />
          <StatCard
            label="Kategorier med avvik"
            value={String(dashboardKpis.badCount)}
            sub={kpiSub}
            icon={AlertTriangle}
            trend={dashboardKpis.badCount === 0 ? 'up' : 'down'}
            color={dashboardKpis.badCount === 0 ? '#0CA678' : '#E03131'}
            info="Antall linjer der utgift er over budsjett eller inntekt under budsjett."
          />
        </div>

        <div className="rounded-2xl p-4 sm:p-6 space-y-3 min-w-0" style={cardStyle}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Netto per måned ({year})
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Viser hele kalenderåret for valgt år — uavhengig av om tabellene under er filtrert til én måned eller YTD.
            Linjene er budsjettert netto (inntekt − kostnader) og faktisk netto per måned.
          </p>
          <BudgetDashboardMonthlyChart series={monthlySeries} year={year} />
        </div>

        {displayCategories.length === 0 && (
          <div
            className="rounded-2xl p-4 sm:p-5 text-sm"
            style={{ ...cardStyle, color: 'var(--text-muted)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>
              Ingen budsjett for {year}
            </p>
            <p>
              Det finnes ikke budsjettlinjer for dette året (ikke aktivt budsjett og ikke i arkiv). Tabellene viser derfor
              ingen rader — alt er i praksis 0. Velg aktivt budsjettår <strong>{budgetYear}</strong> eller et år du har
              arkivert fra budsjett-siden. Faktiske transaksjoner i {year} vises bare for kategorier som finnes i budsjettet.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,40rem)] gap-4 sm:gap-6 lg:gap-8 items-start">
          <section className="rounded-2xl p-4 sm:p-6 space-y-4 min-w-0" style={cardStyle}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Budsjett vs faktisk
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {helpIngress} Avvik = faktisk minus budsjettert — for utgifter er positivt avvik ofte «over budsjett».
              Klikk et kategorinavn for å åpne transaksjoner med filter.
            </p>
            <BudgetVsActualTables budgetVsByParent={budgetVsByParent} linkHrefForCategory={linkHrefForCategory} />
          </section>

          <section
            className="rounded-2xl p-4 sm:p-6 space-y-4 min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:min-h-0"
            style={cardStyle}
          >
            <h2 className="text-lg font-semibold shrink-0" style={{ color: 'var(--text)' }}>
              Topp 25 utgifter
            </h2>
            <p className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>
              Rangert etter faktisk forbruk i perioden. Budsjett vises som referanse.
            </p>
            <div className="min-h-0 lg:overflow-y-auto lg:pr-1 -mr-1">
              <TopExpenseCategoriesTable rows={budgetVsRows} linkHrefForCategory={linkHrefForCategory} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
