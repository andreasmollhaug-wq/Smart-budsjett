'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  buildBudgetVsActualForPeriod,
  MONTH_LABELS_SHORT_NB,
  sumTransactionsByCategoryForMonthRange,
  type BudgetVsActualRow,
  type MonthlyBudgetActualPoint,
} from '@/lib/bankReportData'
import { transactionsHrefForCategory } from '@/lib/budgetDashboardLinks'
import {
  isCalendarFutureMonth,
  varianceCellBackground,
  varianceCssColor,
  varianceTextColorForLine,
} from '@/lib/budgetYearMatrixHelpers'
import type { PeriodMode } from '@/lib/budgetPeriod'
import type { LabelLists } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory, Transaction } from '@/lib/store'
import { useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'

function isMonthInKpiRange(m: number, start: number, end: number): boolean {
  return m >= start && m <= end
}

function sumTwelve(getter: (mi: number) => number): number {
  let s = 0
  for (let mi = 0; mi < 12; mi++) s += getter(mi)
  return s
}

/** Faktisk netto minus budsjettert netto: positivt = bedre enn budsjett (samme som KPI-kort). */
function netResultVarianceTone(v: number): 'muted' | 'good' | 'bad' {
  if (v === 0) return 'muted'
  return v > 0 ? 'good' : 'bad'
}

function netVarianceCellBackground(tone: 'muted' | 'good' | 'bad'): string | undefined {
  if (tone === 'good') return varianceCellBackground(tone)
  if (tone === 'bad') return 'color-mix(in srgb, var(--danger) 11%, transparent)'
  return undefined
}

const ARSVISNING_TOP_VARIANCE_COUNT = 10
const ARSVISNING_TOP_EXPENSES_COUNT = 10

export default function BudgetArsvisningMonthlyResultPanel({
  series,
  year,
  transactions,
  displayCategories,
  labelLists,
  kpiMonthStart,
  kpiMonthEnd,
  periodMode,
  periodSubtitle,
}: {
  series: MonthlyBudgetActualPoint[]
  year: number
  transactions: Transaction[]
  displayCategories: BudgetCategory[]
  labelLists?: LabelLists
  kpiMonthStart: number
  kpiMonthEnd: number
  periodMode: PeriodMode
  periodSubtitle: string
}) {
  const { formatNOK } = useNokDisplayFormatters()
  const people = useStore((s) => s.people)
  const [moreInfoExpanded, setMoreInfoExpanded] = useState(false)
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false)
  const [showActualBreakdown, setShowActualBreakdown] = useState(false)
  const [showVariance, setShowVariance] = useState(false)
  const [showTopYearExpenses, setShowTopYearExpenses] = useState(false)

  const byMonth = useMemo(() => {
    const arr: (MonthlyBudgetActualPoint | undefined)[] = Array(12)
    for (const p of series) arr[p.monthIndex] = p
    return arr
  }, [series])

  const getPoint = (mi: number) => byMonth[mi]

  const monthsInKpiPeriod = useMemo(() => {
    const r: number[] = []
    for (let m = kpiMonthStart; m <= kpiMonthEnd; m++) r.push(m)
    return r
  }, [kpiMonthStart, kpiMonthEnd])

  const varianceTopByMonth = useMemo(() => {
    if (!showVariance) return null
    const map = new Map<number, BudgetVsActualRow[]>()
    for (const m of monthsInKpiPeriod) {
      const totals = sumTransactionsByCategoryForMonthRange(transactions, year, m, m, people)
      const rows = [...buildBudgetVsActualForPeriod(displayCategories, totals, m, m, labelLists)].sort(
        (a, b) => Math.abs(b.variance) - Math.abs(a.variance),
      )
      map.set(m, rows.slice(0, ARSVISNING_TOP_VARIANCE_COUNT))
    }
    return map
  }, [showVariance, year, transactions, displayCategories, labelLists, monthsInKpiPeriod, people])

  const topYearExpenseRows = useMemo(() => {
    if (!showTopYearExpenses) return null
    const totals = sumTransactionsByCategoryForMonthRange(
      transactions,
      year,
      kpiMonthStart,
      kpiMonthEnd,
      people,
    )
    const rows: { id: string; name: string; total: number }[] = []
    for (const c of displayCategories) {
      if (c.type !== 'expense') continue
      const total = totals.get(c.name)?.expense ?? 0
      if (total <= 0) continue
      rows.push({ id: c.id, name: c.name, total })
    }
    rows.sort((a, b) => b.total - a.total)
    return rows.slice(0, ARSVISNING_TOP_EXPENSES_COUNT)
  }, [showTopYearExpenses, transactions, year, displayCategories, kpiMonthStart, kpiMonthEnd, people])

  const expenseListTxMonthIndex = periodMode === 'month' ? kpiMonthStart : 0

  const cellBase =
    'py-2 px-1.5 sm:px-2 text-right text-xs sm:text-sm whitespace-nowrap border-b tabular-nums'
  const stickyLineCol =
    'py-2 px-1.5 sm:px-2 text-left align-top text-xs sm:text-sm border-b sticky left-0 z-[2] min-w-[9rem] max-w-[min(46vw,14rem)] sm:max-w-[15rem] sm:min-w-[11rem]'
  const dimClass = 'opacity-[0.38]'
  const summaryTh =
    'py-2 px-1.5 sm:px-2 text-right text-xs font-semibold border-b whitespace-nowrap border-l-2'
  const summaryTd = `${cellBase} border-l-2`

  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
  } as const

  const toggleBtn =
    'inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm touch-manipulation border'

  const budgetNet = (p: MonthlyBudgetActualPoint) => p.budgetedIncome - p.budgetedExpense
  const actualNet = (p: MonthlyBudgetActualPoint) => p.actualIncome - p.actualExpense

  const sumYearBudgetNet = sumTwelve((mi) => {
    const p = getPoint(mi)
    return p ? budgetNet(p) : 0
  })
  const sumYearActualNet = sumTwelve((mi) => {
    const p = getPoint(mi)
    return p ? actualNet(p) : 0
  })

  const sumYearBudgetIncome = sumTwelve((mi) => getPoint(mi)?.budgetedIncome ?? 0)
  const sumYearBudgetExpense = sumTwelve((mi) => getPoint(mi)?.budgetedExpense ?? 0)
  const sumYearActualIncome = sumTwelve((mi) => getPoint(mi)?.actualIncome ?? 0)
  const sumYearActualExpense = sumTwelve((mi) => getPoint(mi)?.actualExpense ?? 0)

  const sumYearNetVariance = sumYearActualNet - sumYearBudgetNet

  return (
    <div className="rounded-2xl p-4 sm:p-6 space-y-3 min-w-0" style={cardStyle}>
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Månedlig resultat
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Budsjett og faktisk per kalendermåned i {year}. Raden «Netto avvik» viser faktisk minus budsjettert netto —
          grønt er bedre enn budsjett, rødt er svakere. Måneder utenfor valgt
          KPI-periode er nedtonet (samme som tabellen under).
        </p>
        <div
          className="min-w-0 border-t pt-1 mt-3"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
        >
          <button
            type="button"
            id="arsvisning-monthly-more-trigger"
            aria-expanded={moreInfoExpanded}
            aria-controls="arsvisning-monthly-more-panel"
            onClick={() => setMoreInfoExpanded((o) => !o)}
            className="w-full flex items-center justify-between gap-2 min-h-[44px] py-1.5 px-1 rounded-lg text-left text-sm touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Mer informasjon</span>
            <ChevronDown
              size={18}
              className={`shrink-0 transition-transform duration-200 ${moreInfoExpanded ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {moreInfoExpanded ? (
            <div
              id="arsvisning-monthly-more-panel"
              role="region"
              aria-labelledby="arsvisning-monthly-more-trigger"
              className="mt-2 rounded-xl p-3 sm:p-4 space-y-2 min-w-0"
              style={{
                border: '1px solid var(--border)',
                background: 'color-mix(in srgb, var(--surface) 65%, var(--bg))',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Valgfrie rader og lister i tabellen under (samme periode som KPI: {periodSubtitle}).
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-expanded={showBudgetBreakdown}
                  aria-label="Vis eller skjul budsjettert inntekt og utgift per måned"
                  onClick={() => setShowBudgetBreakdown((o) => !o)}
                  className={toggleBtn}
                  style={{
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                    background: showBudgetBreakdown ? 'var(--primary-pale)' : 'var(--bg)',
                  }}
                >
                  Budsjett · inntekt og utgift
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${showBudgetBreakdown ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  aria-expanded={showActualBreakdown}
                  aria-label="Vis eller skjul faktisk inntekt og utgift per måned"
                  onClick={() => setShowActualBreakdown((o) => !o)}
                  className={toggleBtn}
                  style={{
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                    background: showActualBreakdown ? 'var(--primary-pale)' : 'var(--bg)',
                  }}
                >
                  Faktisk · inntekt og utgift
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${showActualBreakdown ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  aria-expanded={showTopYearExpenses}
                  aria-label={`Vis eller skjul de ti største utgiftene i valgt periode (${periodSubtitle})`}
                  onClick={() => setShowTopYearExpenses((o) => !o)}
                  className={toggleBtn}
                  style={{
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                    background: showTopYearExpenses ? 'var(--primary-pale)' : 'var(--bg)',
                  }}
                >
                  Topp 10 utgifter
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${showTopYearExpenses ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  aria-expanded={showVariance}
                  aria-label={`Vis eller skjul de ti største avvikene per kategori for hver måned i valgt periode (${periodSubtitle})`}
                  onClick={() => setShowVariance((o) => !o)}
                  className={toggleBtn}
                  style={{
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                    background: showVariance ? 'var(--primary-pale)' : 'var(--bg)',
                  }}
                >
                  Avvik per kategori (topp 10)
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${showVariance ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="overflow-x-auto touch-pan-x touch-manipulation overscroll-x-contain -mx-1 px-1 sm:mx-0 sm:px-0"
        style={{
          paddingLeft: 'max(0.25rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.25rem, env(safe-area-inset-right))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <table
          className="w-max min-w-full border-collapse text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          <thead>
            <tr style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
              <th
                className={`${stickyLineCol} font-semibold`}
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                }}
                scope="col"
              >
                Linje
              </th>
              {MONTH_LABELS_SHORT_NB.map((lab, mi) => {
                const future = isCalendarFutureMonth(year, mi)
                return (
                  <th
                    key={lab}
                    className="py-2 px-1 sm:px-1.5 text-right text-xs font-semibold border-b whitespace-nowrap"
                    style={{
                      borderColor: 'var(--border)',
                      ...(future
                        ? { background: 'color-mix(in srgb, var(--border) 18%, var(--bg))' }
                        : {}),
                    }}
                    scope="col"
                  >
                    <span className="sm:hidden">{lab.slice(0, 1)}</span>
                    <span className="hidden sm:inline">{lab}</span>
                  </th>
                )
              })}
              <th
                className={summaryTh}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--primary)',
                  background: 'var(--primary-pale)',
                  color: 'var(--text)',
                }}
                scope="col"
              >
                Sum år
              </th>
              <th
                className={summaryTh}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--border)',
                  background: 'var(--primary-pale)',
                  color: 'var(--text)',
                }}
                scope="col"
                title="Snitt per måned over tolv måneder"
              >
                <span className="sm:hidden">Snitt</span>
                <span className="hidden sm:inline">Snitt (12 mnd)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ color: 'var(--text)' }}>
              <td
                className={`${stickyLineCol} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                }}
              >
                Budsjettert resultat
              </td>
              {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                const p = getPoint(mi)
                const v = p ? budgetNet(p) : 0
                const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                const future = isCalendarFutureMonth(year, mi)
                return (
                  <td
                    key={mi}
                    className={`${cellBase} ${kpiDim} font-medium`}
                    style={{
                      borderColor: 'var(--border)',
                      background: future
                        ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                        : undefined,
                    }}
                  >
                    {formatNOK(v)}
                  </td>
                )
              })}
              <td
                className={`${summaryTd} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--primary)',
                  background: 'var(--primary-pale)',
                  color: 'var(--text)',
                }}
              >
                {formatNOK(sumYearBudgetNet)}
              </td>
              <td
                className={`${summaryTd} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--border)',
                  background: 'var(--primary-pale)',
                  color: 'var(--text-muted)',
                }}
              >
                {formatNOK(sumYearBudgetNet / 12)}
              </td>
            </tr>
            <tr style={{ color: 'var(--text)' }}>
              <td
                className={`${stickyLineCol} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg)',
                  boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                }}
              >
                Faktisk resultat
              </td>
              {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                const p = getPoint(mi)
                const v = p ? actualNet(p) : 0
                const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                const future = isCalendarFutureMonth(year, mi)
                return (
                  <td
                    key={mi}
                    className={`${cellBase} ${kpiDim} font-medium`}
                    style={{
                      borderColor: 'var(--border)',
                      background: future
                        ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                        : undefined,
                    }}
                  >
                    {formatNOK(v)}
                  </td>
                )
              })}
              <td
                className={`${summaryTd} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--primary)',
                  background: 'var(--primary-pale)',
                  color: 'var(--text)',
                }}
              >
                {formatNOK(sumYearActualNet)}
              </td>
              <td
                className={`${summaryTd} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--border)',
                  background: 'var(--primary-pale)',
                  color: 'var(--text-muted)',
                }}
              >
                {formatNOK(sumYearActualNet / 12)}
              </td>
            </tr>
            <tr style={{ color: 'var(--text)' }}>
              <td
                className={`${stickyLineCol} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--bg)',
                  boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                }}
                title="Faktisk netto minus budsjettert netto (faktisk − budsjett). Positivt = bedre enn budsjett."
              >
                Netto avvik
              </td>
              {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                const p = getPoint(mi)
                const netV = p ? actualNet(p) - budgetNet(p) : 0
                const tone = netResultVarianceTone(netV)
                const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                const future = isCalendarFutureMonth(year, mi)
                const varBg = netVarianceCellBackground(tone)
                const futureBg = future ? 'color-mix(in srgb, var(--border) 12%, var(--bg))' : undefined
                const bg = varBg ?? futureBg
                return (
                  <td
                    key={mi}
                    className={`${cellBase} ${kpiDim} font-medium`}
                    style={{
                      borderColor: 'var(--border)',
                      color: varianceCssColor(tone),
                      background: bg,
                    }}
                  >
                    {formatNOK(netV)}
                  </td>
                )
              })}
              <td
                className={`${summaryTd} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--primary)',
                  background: 'var(--primary-pale)',
                  color: varianceCssColor(netResultVarianceTone(sumYearNetVariance)),
                }}
              >
                {formatNOK(sumYearNetVariance)}
              </td>
              <td
                className={`${summaryTd} font-medium`}
                style={{
                  borderColor: 'var(--border)',
                  borderLeftColor: 'var(--border)',
                  background: 'var(--primary-pale)',
                  color: varianceCssColor(netResultVarianceTone(sumYearNetVariance)),
                }}
              >
                {formatNOK(sumYearNetVariance / 12)}
              </td>
            </tr>

            {showBudgetBreakdown ? (
              <>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <td
                    className={stickyLineCol}
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                    }}
                  >
                    Budsjett · inntekt
                  </td>
                  {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                    const p = getPoint(mi)
                    const v = p?.budgetedIncome ?? 0
                    const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                    const future = isCalendarFutureMonth(year, mi)
                    return (
                      <td
                        key={mi}
                        className={`${cellBase} ${kpiDim}`}
                        style={{
                          borderColor: 'var(--border)',
                          background: future
                            ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                            : 'var(--surface)',
                        }}
                      >
                        {formatNOK(v)}
                      </td>
                    )
                  })}
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--primary)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearBudgetIncome)}
                  </td>
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--border)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearBudgetIncome / 12)}
                  </td>
                </tr>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <td
                    className={stickyLineCol}
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                    }}
                  >
                    Budsjett · utgift
                  </td>
                  {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                    const p = getPoint(mi)
                    const v = p?.budgetedExpense ?? 0
                    const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                    const future = isCalendarFutureMonth(year, mi)
                    return (
                      <td
                        key={mi}
                        className={`${cellBase} ${kpiDim}`}
                        style={{
                          borderColor: 'var(--border)',
                          background: future
                            ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                            : 'var(--surface)',
                        }}
                      >
                        {formatNOK(v)}
                      </td>
                    )
                  })}
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--primary)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearBudgetExpense)}
                  </td>
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--border)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearBudgetExpense / 12)}
                  </td>
                </tr>
              </>
            ) : null}

            {showActualBreakdown ? (
              <>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <td
                    className={stickyLineCol}
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                    }}
                  >
                    Faktisk · inntekt
                  </td>
                  {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                    const p = getPoint(mi)
                    const v = p?.actualIncome ?? 0
                    const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                    const future = isCalendarFutureMonth(year, mi)
                    return (
                      <td
                        key={mi}
                        className={`${cellBase} ${kpiDim}`}
                        style={{
                          borderColor: 'var(--border)',
                          background: future
                            ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                            : 'var(--surface)',
                        }}
                      >
                        {formatNOK(v)}
                      </td>
                    )
                  })}
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--primary)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearActualIncome)}
                  </td>
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--border)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearActualIncome / 12)}
                  </td>
                </tr>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <td
                    className={stickyLineCol}
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      boxShadow: '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                    }}
                  >
                    Faktisk · utgift
                  </td>
                  {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                    const p = getPoint(mi)
                    const v = p?.actualExpense ?? 0
                    const kpiDim = !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                    const future = isCalendarFutureMonth(year, mi)
                    return (
                      <td
                        key={mi}
                        className={`${cellBase} ${kpiDim}`}
                        style={{
                          borderColor: 'var(--border)',
                          background: future
                            ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                            : 'var(--surface)',
                        }}
                      >
                        {formatNOK(v)}
                      </td>
                    )
                  })}
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--primary)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearActualExpense)}
                  </td>
                  <td
                    className={summaryTd}
                    style={{
                      borderColor: 'var(--border)',
                      borderLeftColor: 'var(--border)',
                      background: 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatNOK(sumYearActualExpense / 12)}
                  </td>
                </tr>
              </>
            ) : null}

            {showTopYearExpenses && topYearExpenseRows ? (
              <tr>
                <td
                  colSpan={15}
                  className="px-2 py-3 border-b align-top"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Største faktiske utgifter i valgt periode ({periodSubtitle}) — budsjettlinjer, summert over månedene i
                    perioden. Lenkene åpner transaksjoner for samme periode som verktøylinjen.
                  </p>
                  {topYearExpenseRows.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Ingen utgiftslinjer med registrert forbruk i perioden.
                    </p>
                  ) : (
                    <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm min-w-0" style={{ color: 'var(--text)' }}>
                      {topYearExpenseRows.map((r) => (
                        <li key={r.id} className="pl-1">
                          <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
                            <Link
                              href={transactionsHrefForCategory(periodMode, year, expenseListTxMonthIndex, r.name)}
                              className="underline underline-offset-2 hover:opacity-90 break-words"
                              style={{ color: 'var(--primary)' }}
                            >
                              {r.name}
                            </Link>
                            <span className="tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {formatNOK(r.total)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </td>
              </tr>
            ) : null}

            {showVariance && varianceTopByMonth ? (
              <tr>
                <td
                  colSpan={15}
                  className="px-2 py-3 border-b align-top"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Største avvik per måned i valgt periode ({periodSubtitle}) — faktisk − budsjett, topp{' '}
                    {ARSVISNING_TOP_VARIANCE_COUNT} linjer. Kun måneder i perioden vises.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 min-w-0">
                    {monthsInKpiPeriod.map((mi) => {
                      const lab = MONTH_LABELS_SHORT_NB[mi] ?? String(mi)
                      const top = varianceTopByMonth?.get(mi) ?? []
                      return (
                        <div key={lab} className="min-w-0">
                          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                            {lab}
                          </div>
                          {top.length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              —
                            </p>
                          ) : (
                            <ul className="space-y-1.5 text-xs min-w-0">
                              {top.map((r) => (
                                <li key={r.categoryId} className="min-w-0">
                                  <Link
                                    href={transactionsHrefForCategory('month', year, mi, r.name)}
                                    className="underline underline-offset-2 hover:opacity-90 break-words"
                                    style={{ color: 'var(--primary)' }}
                                  >
                                    {r.name}
                                  </Link>
                                  <span
                                    className="tabular-nums block"
                                    style={{
                                      color: varianceCssColor(varianceTextColorForLine(r.type, r.variance)),
                                    }}
                                  >
                                    {formatNOK(r.variance)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
