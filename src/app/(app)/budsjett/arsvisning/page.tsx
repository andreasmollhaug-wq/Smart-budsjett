'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Header from '@/components/layout/Header'
import BudgetArsvisningDataInsightsPanel from '@/components/budget/BudgetArsvisningDataInsightsPanel'
import BudgetArsvisningMonthlyResultPanel from '@/components/budget/BudgetArsvisningMonthlyResultPanel'
import BudgetYearMatrixTable from '@/components/budget/BudgetYearMatrixTable'
import BudsjettSubnav from '@/components/budget/BudsjettSubnav'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import StatCard from '@/components/ui/StatCard'
import {
  buildBudgetVsActualForPeriod,
  buildCategoryActualsYearMatrix,
  buildCategoryBudgetYearMatrix,
  buildMonthlyBudgetActualSeries,
  groupBudgetCategoriesByParent,
  referenceMonthIndexForBudgetYear,
  sumTransactionsByCategoryForMonthRange,
} from '@/lib/bankReportData'
import { periodRange, periodSubtitle, type PeriodMode } from '@/lib/budgetPeriod'
import {
  ARSVISNING_LINE_FILTER_OPTIONS,
  ARSVISNING_LINE_FILTER_STORAGE_KEY,
  ARSVISNING_ROW_LABELS,
  ARSVISNING_ROW_ORDER,
  ARSVISNING_ROW_TOGGLES_STORAGE_KEY,
  DEFAULT_ARSVISNING_LINE_FILTER,
  DEFAULT_ARSVISNING_ROW_VISIBILITY,
  filterCategoryIdsForArsvisningLineFilter,
  parseStoredArsvisningLineFilter,
  parseStoredArsvisningRowVisibility,
  type ArsvisningLineFilterMode,
  type ArsvisningRowKey,
  type ArsvisningRowVisibility,
} from '@/lib/budgetYearMatrixHelpers'
import { buildArsvisningDataInsights, summarizeBudgetVsRows } from '@/lib/dashboardOverviewHelpers'
import { mergeBudgetCategoriesFromSnapshots, useActivePersonFinance, useStore } from '@/lib/store'
import { formatNOK } from '@/lib/utils'
import { AlertTriangle, ChevronDown, Scale, TrendingDown, Wallet } from 'lucide-react'

export default function BudsjettArsvisningPage() {
  const {
    transactions,
    budgetCategories,
    budgetYear,
    archivedBudgetsByYear,
    profiles,
    activeProfileId,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const people = useStore((s) => s.people)

  const [year, setYear] = useState(budgetYear)
  const [monthIndex, setMonthIndex] = useState(() => referenceMonthIndexForBudgetYear(budgetYear))
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [rowVisibility, setRowVisibility] = useState<ArsvisningRowVisibility>(DEFAULT_ARSVISNING_ROW_VISIBILITY)
  const [rowTogglesHydrated, setRowTogglesHydrated] = useState(false)
  const [lineFilterMode, setLineFilterMode] = useState<ArsvisningLineFilterMode>(DEFAULT_ARSVISNING_LINE_FILTER)
  const [lineFilterHydrated, setLineFilterHydrated] = useState(false)
  const [lineFilterExpanded, setLineFilterExpanded] = useState(false)

  useEffect(() => {
    setYear(budgetYear)
  }, [budgetYear])

  useEffect(() => {
    setMonthIndex(referenceMonthIndexForBudgetYear(year))
  }, [year])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const parsed = parseStoredArsvisningRowVisibility(localStorage.getItem(ARSVISNING_ROW_TOGGLES_STORAGE_KEY))
    if (parsed) setRowVisibility(parsed)
    setRowTogglesHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setLineFilterMode(parseStoredArsvisningLineFilter(localStorage.getItem(ARSVISNING_LINE_FILTER_STORAGE_KEY)))
    setLineFilterHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !rowTogglesHydrated) return
    try {
      localStorage.setItem(ARSVISNING_ROW_TOGGLES_STORAGE_KEY, JSON.stringify(rowVisibility))
    } catch {
      /* ignore */
    }
  }, [rowVisibility, rowTogglesHydrated])

  useEffect(() => {
    if (typeof window === 'undefined' || !lineFilterHydrated) return
    try {
      localStorage.setItem(ARSVISNING_LINE_FILTER_STORAGE_KEY, JSON.stringify(lineFilterMode))
    } catch {
      /* ignore */
    }
  }, [lineFilterMode, lineFilterHydrated])

  const handleRowToggle = useCallback((key: ArsvisningRowKey, checked: boolean) => {
    setRowVisibility((prev) => {
      const next = { ...prev, [key]: checked }
      if (!ARSVISNING_ROW_ORDER.some((k) => next[k])) {
        return DEFAULT_ARSVISNING_ROW_VISIBILITY
      }
      return next
    })
  }, [])

  const resetRowVisibility = useCallback(() => {
    setRowVisibility(DEFAULT_ARSVISNING_ROW_VISIBILITY)
  }, [])

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
    () => sumTransactionsByCategoryForMonthRange(transactions, year, start, end, people),
    [transactions, year, start, end, people],
  )

  const budgetVsRows = useMemo(
    () => buildBudgetVsActualForPeriod(displayCategories, monthTotals, start, end),
    [displayCategories, monthTotals, start, end],
  )

  const lineFilterCategoryIds = useMemo(
    () => filterCategoryIdsForArsvisningLineFilter(budgetVsRows, lineFilterMode),
    [budgetVsRows, lineFilterMode],
  )

  const tableDisplayCategories = useMemo(() => {
    if (!lineFilterCategoryIds) return displayCategories
    return displayCategories.filter((c) => lineFilterCategoryIds.has(c.id))
  }, [displayCategories, lineFilterCategoryIds])

  const summary = useMemo(() => summarizeBudgetVsRows(budgetVsRows), [budgetVsRows])

  const actualYearMatrix = useMemo(
    () => buildCategoryActualsYearMatrix(transactions, year, displayCategories, people),
    [transactions, year, displayCategories, people],
  )

  const budgetYearMatrix = useMemo(
    () => buildCategoryBudgetYearMatrix(displayCategories),
    [displayCategories],
  )

  const categoriesByParent = useMemo(
    () => groupBudgetCategoriesByParent(tableDisplayCategories),
    [tableDisplayCategories],
  )

  const insights = useMemo(
    () =>
      buildArsvisningDataInsights({
        transactions,
        year,
        displayCategories,
        actualYearMatrix,
      }),
    [transactions, year, displayCategories, actualYearMatrix],
  )

  const monthlyBudgetActualSeries = useMemo(
    () => buildMonthlyBudgetActualSeries(transactions, year, displayCategories, people),
    [transactions, year, displayCategories, people],
  )

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    const window = Array.from({ length: 11 }, (_, i) => y - 5 + i)
    const set = new Set<number>([budgetYear, year, ...Object.keys(archivedBudgetsByYear).map(Number), ...window])
    return [...set].sort((a, b) => b - a)
  }, [budgetYear, archivedBudgetsByYear, year])

  const subtitle = periodSubtitle(periodMode, year, monthIndex)
  const kpiSub = `${subtitle} (KPI)`

  const cardStyle: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col" style={{ background: 'var(--bg)' }}>
      <Header title="Budsjett" subtitle={`Årsoversikt · ${subtitle}`} />
      <BudsjettSubnav />
      <div className="p-4 sm:p-6 lg:px-8 lg:py-8 xl:px-10 space-y-4 sm:space-y-6 flex-1 w-full min-w-0">
        {isHouseholdAggregate && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--primary-pale)',
              border: '1px solid var(--accent)',
              color: 'var(--text)',
            }}
          >
            Du ser samlet husholdning — budsjett kan ikke redigeres her. Velg en person under «Viser data for» for å endre
            linjer.
          </div>
        )}

        <div className="rounded-2xl p-4 sm:p-6 space-y-4 min-w-0" style={cardStyle}>
          <DashboardPeriodToolbar
            filterYear={year}
            onFilterYearChange={setYear}
            periodMode={periodMode}
            onPeriodModeChange={setPeriodMode}
            monthIndex={monthIndex}
            onMonthIndexChange={setMonthIndex}
            yearOptions={yearOptions}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
          <StatCard
            label="Faktisk netto"
            value={formatNOK(summary.actualNet)}
            sub={kpiSub}
            icon={Wallet}
            trend={summary.actualNet >= 0 ? 'up' : 'down'}
            color={summary.actualNet >= 0 ? '#0CA678' : '#E03131'}
            info="Inntekter minus utgifter i valgt periode, basert på registrerte transaksjoner."
          />
          <StatCard
            label="Budsjettert netto"
            value={formatNOK(summary.budgetNet)}
            sub={kpiSub}
            icon={Scale}
            trend={summary.budgetNet >= 0 ? 'up' : 'down'}
            color={summary.budgetNet >= 0 ? '#3B5BDB' : '#E03131'}
            info="Inntekter minus utgifter etter budsjett for samme periode."
          />
          <StatCard
            label="Netto avvik"
            value={formatNOK(summary.varianceNet)}
            sub={kpiSub}
            icon={TrendingDown}
            trend={summary.varianceNet >= 0 ? 'up' : 'down'}
            color={summary.varianceNet >= 0 ? '#0CA678' : '#E03131'}
            info="Faktisk netto minus budsjettert netto. Positivt betyr bedre enn budsjett."
          />
          <StatCard
            label="Kategorier med avvik"
            value={String(summary.badCount)}
            sub={kpiSub}
            icon={AlertTriangle}
            trend={summary.badCount === 0 ? 'up' : 'down'}
            color={summary.badCount === 0 ? '#0CA678' : '#E03131'}
            info="Inntektslinjer under budsjett, eller utgiftslinjer over budsjett, i valgt periode."
          />
        </div>

        <BudgetArsvisningDataInsightsPanel items={insights} />

        {displayCategories.length > 0 ? (
          <BudgetArsvisningMonthlyResultPanel
            series={monthlyBudgetActualSeries}
            year={year}
            transactions={transactions}
            displayCategories={displayCategories}
            kpiMonthStart={start}
            kpiMonthEnd={end}
            periodMode={periodMode}
            periodSubtitle={subtitle}
          />
        ) : null}

        {displayCategories.length === 0 ? (
          <div
            className="rounded-2xl p-4 sm:p-5 text-sm"
            style={{ ...cardStyle, color: 'var(--text-muted)' }}
          >
            Ingen budsjettdata for {year}. Velg et annet år eller opprett budsjett under «Budsjett».
          </div>
        ) : (
          <div className="rounded-2xl p-4 sm:p-6 space-y-4 min-w-0" style={cardStyle}>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Måned for måned ({year})
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Sum og snitt gjelder hele året. Nedtoning og linjefilter følger valgt periode (samme som KPI over).
              </p>
            </div>

            {tableDisplayCategories.length > 0 ? (
              <fieldset className="min-w-0 space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                <legend className="text-sm font-medium px-1" style={{ color: 'var(--text)' }}>
                  Vis rader i tabellen
                </legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 min-w-0">
                    {ARSVISNING_ROW_ORDER.map((key) => (
                      <label
                        key={key}
                        className="inline-flex items-center gap-2 min-h-[44px] min-w-0 touch-manipulation cursor-pointer"
                      >
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center">
                          <input
                            type="checkbox"
                            checked={rowVisibility[key]}
                            onChange={(e) => handleRowToggle(key, e.target.checked)}
                            className="h-5 w-5 rounded border"
                            style={{ borderColor: 'var(--border)', accentColor: 'var(--primary)' }}
                          />
                        </span>
                        <span className="text-sm flex-1 min-w-0" style={{ color: 'var(--text)' }}>
                          {ARSVISNING_ROW_LABELS[key]}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={resetRowVisibility}
                    className="text-sm font-medium min-h-[44px] w-full sm:w-auto shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl underline-offset-2 hover:underline touch-manipulation"
                    style={{ color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                  >
                    Tilbakestill til standard
                  </button>
                </div>
              </fieldset>
            ) : null}

            <div
              className="min-w-0 border-t pt-1 mt-1"
              style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
            >
              <button
                type="button"
                id="arsvisning-line-filter-trigger"
                aria-expanded={lineFilterExpanded}
                aria-controls="arsvisning-line-filter-panel"
                onClick={() => setLineFilterExpanded((o) => !o)}
                className="w-full flex items-center justify-between gap-2 min-h-[44px] py-1.5 px-1 rounded-lg text-left text-sm touch-manipulation"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Filtrer linjer</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-transform duration-200 ${lineFilterExpanded ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {lineFilterExpanded ? (
                <div
                  id="arsvisning-line-filter-panel"
                  role="region"
                  aria-labelledby="arsvisning-line-filter-trigger"
                  className="pb-2 pt-1 space-y-2 min-w-0"
                >
                  <p className="text-xs pl-1" style={{ color: 'var(--text-muted)' }}>
                    Avvik i valgt periode (som KPI). Tabellen viser fortsatt alle måneder.
                  </p>
                  <div className="flex flex-col gap-1 min-w-0" role="radiogroup" aria-label="Filtrer linjer">
                    {ARSVISNING_LINE_FILTER_OPTIONS.map(({ value, label }) => (
                      <label
                        key={value}
                        className="inline-flex items-center gap-2 min-h-[44px] min-w-0 touch-manipulation cursor-pointer"
                      >
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center">
                          <input
                            type="radio"
                            name="arsvisning-line-filter"
                            checked={lineFilterMode === value}
                            onChange={() => setLineFilterMode(value)}
                            className="h-5 w-5 rounded-full border"
                            style={{ borderColor: 'var(--border)', accentColor: 'var(--primary)' }}
                          />
                        </span>
                        <span className="text-sm flex-1 min-w-0" style={{ color: 'var(--text)' }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {tableDisplayCategories.length === 0 ? (
              <div
                className="rounded-xl p-4 sm:p-5 text-sm"
                style={{ ...cardStyle, color: 'var(--text-muted)' }}
              >
                Ingen linjer matcher filteret i valgt periode — åpne «Filtrer linjer» over og velg «Alle linjer», eller
                prøv en annen periode.
              </div>
            ) : (
              <BudgetYearMatrixTable
                categoriesByParent={categoriesByParent}
                actualMatrix={actualYearMatrix}
                budgetMatrix={budgetYearMatrix}
                kpiMonthStart={start}
                kpiMonthEnd={end}
                rowVisibility={rowVisibility}
                year={year}
              />
            )}
          </div>
        )}

        {displayCategories.length > 0 && tableDisplayCategories.length > 0 ? (
          <p
            className="text-xs sm:text-sm lg:hidden rounded-xl px-3 py-2"
            style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            Tips: Sveip sideveis i tabellen for å se alle måneder på mobil.
          </p>
        ) : null}
      </div>
    </div>
  )
}
