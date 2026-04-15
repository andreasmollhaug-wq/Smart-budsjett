'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronDown, Info, TrendingDown, TrendingUp } from 'lucide-react'
import type { BudgetVsActualRow, MonthlyNetPoint } from '@/lib/bankReportData'
import type { BudgetVsSummary } from '@/lib/dashboardOverviewHelpers'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { transactionsListeHrefForCategory } from '@/lib/budgetDashboardLinks'
import { netVariancePct, variancePctVsBudget } from '@/lib/budgetVariancePct'
import { formatIntegerNbNo, formatNOK } from '@/lib/utils'

const INFO_TEXT =
  'Netto er inntekt minus utgifter (alle budsjettkategorier i perioden, inkl. regninger, gjeld og sparing som i resten av budsjettet). Avvik er faktisk netto minus budsjettert netto: positivt betyr at du sitter igjen mer enn planlagt. Grafen viser samme netto per måned innenfor valgt periode. Avvik i prosent er avvik i kroner dividert med budsjettert beløp for linjen (unntatt netto, der nevneren er budsjettert netto).'

type Props = {
  periodLabel: string
  summary: BudgetVsSummary
  chartSeries: MonthlyNetPoint[]
  budgetVsRows: BudgetVsActualRow[]
  periodMode: PeriodMode
  filterYear: number
  monthIndex: number
  onSelectExpenseCategory: (categoryName: string, periodActual: number) => void
}

function varianceColor(varianceNet: number): string {
  if (varianceNet > 0) return 'var(--success)'
  if (varianceNet < 0) return 'var(--danger)'
  return 'var(--text)'
}

function categoryVarianceColor(type: 'expense' | 'income', variance: number): string {
  if (type === 'expense') {
    if (variance > 0) return 'var(--danger)'
    if (variance < 0) return 'var(--success)'
    return 'var(--text)'
  }
  if (variance >= 0) return 'var(--success)'
  return 'var(--danger)'
}

/** Sortering av kategorirader (samme liste for utgift/inntekt). */
type DetailCategorySort = 'variance_abs' | 'variance_pct_abs' | 'name' | 'budget_desc' | 'actual_desc'

function sortCategoryRows(rows: BudgetVsActualRow[], mode: DetailCategorySort): BudgetVsActualRow[] {
  const out = [...rows]
  const pctAbs = (r: BudgetVsActualRow) => {
    if (!Number.isFinite(r.budgeted) || r.budgeted === 0) return 0
    return Math.abs((r.variance / r.budgeted) * 100)
  }
  out.sort((a, b) => {
    switch (mode) {
      case 'variance_abs':
        return Math.abs(b.variance) - Math.abs(a.variance) || a.name.localeCompare(b.name, 'nb')
      case 'variance_pct_abs':
        return (
          pctAbs(b) - pctAbs(a) ||
          Math.abs(b.variance) - Math.abs(a.variance) ||
          a.name.localeCompare(b.name, 'nb')
        )
      case 'name':
        return a.name.localeCompare(b.name, 'nb')
      case 'budget_desc':
        return b.budgeted - a.budgeted || a.name.localeCompare(b.name, 'nb')
      case 'actual_desc':
        return b.actual - a.actual || a.name.localeCompare(b.name, 'nb')
      default:
        return 0
    }
  })
  return out
}

const DETAIL_SORT_OPTIONS: { value: DetailCategorySort; label: string }[] = [
  { value: 'variance_abs', label: 'Størst avvik (beløp)' },
  { value: 'variance_pct_abs', label: 'Størst avvik (prosent)' },
  { value: 'name', label: 'Kategori A–Å' },
  { value: 'budget_desc', label: 'Budsjett (høy → lav)' },
  { value: 'actual_desc', label: 'Faktisk (høy → lav)' },
]

const DETAIL_SORT_SUMMARY_PHRASE: Record<DetailCategorySort, string> = {
  variance_abs: 'Sortert etter størst avvik i kroner.',
  variance_pct_abs: 'Sortert etter størst avvik i prosent.',
  name: 'Sortert alfabetisk etter kategori.',
  budget_desc: 'Sortert etter budsjettbeløp, høyest først.',
  actual_desc: 'Sortert etter faktisk beløp, høyest først.',
}

export default function DashboardNetBudgetPeriodSection({
  periodLabel,
  summary,
  chartSeries,
  budgetVsRows,
  periodMode,
  filterYear,
  monthIndex,
  onSelectExpenseCategory,
}: Props) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSort, setDetailSort] = useState<DetailCategorySort>('variance_abs')
  const infoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const close = (e: PointerEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [infoOpen])

  const { varianceNet, actualNet, budgetNet } = summary
  const incomeVar = summary.actualIncome - summary.budgetedIncome
  const expenseVar = summary.actualExpense - summary.budgetedExpense

  const incomePct = variancePctVsBudget(summary.budgetedIncome, incomeVar)
  const expensePct = variancePctVsBudget(summary.budgetedExpense, expenseVar)
  const netPct = netVariancePct(budgetNet, varianceNet)

  const expenseRows = useMemo(() => {
    const rows = budgetVsRows.filter((r) => r.type === 'expense')
    return sortCategoryRows(rows, detailSort)
  }, [budgetVsRows, detailSort])

  const incomeRows = useMemo(() => {
    const rows = budgetVsRows.filter((r) => r.type === 'income')
    return sortCategoryRows(rows, detailSort)
  }, [budgetVsRows, detailSort])

  const detailPanelSummary = useMemo(() => {
    const sortPhrase = DETAIL_SORT_SUMMARY_PHRASE[detailSort]
    return `Kategoriene under viser budsjett mot faktisk for ${periodLabel}. ${sortPhrase}`
  }, [periodLabel, detailSort])

  const chartData = chartSeries.map((p) => ({
    name: p.label,
    budsjettertNetto: p.budgetNet,
    faktiskNetto: p.actualNet,
  }))

  const numeric = chartSeries.flatMap((p) => [p.budgetNet, p.actualNet])
  const dataMin = numeric.length > 0 ? Math.min(...numeric) : 0
  const dataMax = numeric.length > 0 ? Math.max(...numeric) : 0
  const span = Math.max(dataMax - dataMin, 1e-6)
  const pad = Math.max(span * 0.1, 500)
  const domain: [number, number] = [dataMin - pad, dataMax + pad]

  const hasChartPoints = chartSeries.length > 0
  const chartManyMonths = chartData.length > 6
  const TrendIcon = varianceNet >= 0 ? TrendingUp : TrendingDown

  const detailPanelId = 'net-budget-detail-panel'

  return (
    <div
      className="min-w-0 w-full rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <h2 className="font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              Resultat mot budsjett
            </h2>
            <div className="relative shrink-0 flex items-start" ref={infoWrapRef}>
              <button
                type="button"
                onClick={() => setInfoOpen((o) => !o)}
                aria-expanded={infoOpen}
                aria-label="Mer om resultat mot budsjett"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 touch-manipulation"
                style={{ color: 'var(--text-muted)' }}
              >
                <Info size={18} strokeWidth={2} aria-hidden />
              </button>
              {infoOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1.5 w-[min(calc(100vw-2rem),20rem)] max-w-[calc(100vw-2rem)] rounded-xl p-3 text-left shadow-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  role="region"
                >
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {INFO_TEXT}
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
            {periodLabel}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${varianceNet >= 0 ? '#0CA678' : '#E03131'}20` }}
              aria-hidden
            >
              <TrendIcon size={20} style={{ color: varianceNet >= 0 ? '#0CA678' : '#E03131' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Nettoavvik (faktisk − budsjett)
              </p>
              <p
                className="text-2xl font-bold tabular-nums sm:text-3xl"
                style={{ color: varianceColor(varianceNet) }}
              >
                {varianceNet >= 0 ? '+' : ''}
                {formatNOK(varianceNet)}
              </p>
              <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                Faktisk netto {formatNOK(actualNet)} · Budsjettert netto {formatNOK(budgetNet)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Netto måned for måned
        </p>
        {!hasChartPoints ? (
          <p
            className="flex min-h-[12rem] items-center justify-center rounded-xl px-2 text-center text-sm"
            style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}
          >
            Ingen måneder i perioden å vise.
          </p>
        ) : (
          <div
            className={`w-full min-w-0 touch-manipulation ${chartManyMonths ? 'h-[260px] sm:h-[280px]' : 'h-[220px] sm:h-[240px]'}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 4,
                  left: 0,
                  bottom: chartManyMonths ? 36 : 4,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6B7A99', fontSize: 11 }}
                  interval={chartData.length > 8 ? 'preserveStartEnd' : 0}
                  angle={chartManyMonths ? -35 : 0}
                  textAnchor={chartManyMonths ? 'end' : 'middle'}
                  height={chartManyMonths ? 48 : 28}
                />
                <YAxis
                  domain={domain}
                  tickFormatter={(v) => formatIntegerNbNo(Number(v))}
                  tick={{ fill: '#6B7A99', fontSize: 10 }}
                  width={56}
                />
                <Tooltip
                  formatter={(v) => {
                    const raw = Array.isArray(v) ? v[0] : v
                    const n = typeof raw === 'number' ? raw : Number(raw)
                    return Number.isFinite(n) ? formatNOK(n) : '–'
                  }}
                  labelFormatter={(label) => `Måned: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => <span style={{ color: 'var(--text-muted)' }}>{value}</span>}
                />
                <ReferenceLine y={0} stroke="#ADB5BD" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="budsjettertNetto"
                  name="Budsjettert netto"
                  stroke="#3B5BDB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3B5BDB', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="faktiskNetto"
                  name="Faktisk netto"
                  stroke="#0CA678"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0CA678', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-8 min-w-0 overflow-x-auto touch-manipulation overscroll-x-auto">
        <p className="mb-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          P&amp;L (budsjett vs faktisk)
        </p>
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <table className="w-full min-w-[300px] border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="py-2 pr-2 pl-3 text-left font-medium" style={{ color: 'var(--text-muted)' }} />
                <th className="py-2 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Budsjett
                </th>
                <th className="py-2 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Faktisk
                </th>
                <th className="py-2 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Avvik
                </th>
                <th className="py-2 pr-3 pl-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Avvik %
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="py-2.5 pr-2 pl-3 font-medium" style={{ color: 'var(--text)' }}>
                Inntekter
              </td>
              <td className="py-2.5 px-1 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                {formatNOK(summary.budgetedIncome)}
              </td>
              <td className="py-2.5 px-1 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                {formatNOK(summary.actualIncome)}
              </td>
              <td
                className="py-2.5 px-1 text-right tabular-nums font-medium"
                style={{ color: incomeVar >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {incomeVar >= 0 ? '+' : ''}
                {formatNOK(incomeVar)}
              </td>
              <td
                className="py-2.5 pr-3 pl-1 text-right tabular-nums text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {incomePct ?? '–'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="py-2.5 pr-2 pl-3 font-medium" style={{ color: 'var(--text)' }}>
                Utgifter
              </td>
              <td className="py-2.5 px-1 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                {formatNOK(summary.budgetedExpense)}
              </td>
              <td className="py-2.5 px-1 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                {formatNOK(summary.actualExpense)}
              </td>
              <td
                className="py-2.5 px-1 text-right tabular-nums font-medium"
                style={{ color: expenseVar <= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {expenseVar >= 0 ? '+' : ''}
                {formatNOK(expenseVar)}
              </td>
              <td
                className="py-2.5 pr-3 pl-1 text-right tabular-nums text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {expensePct ?? '–'}
              </td>
            </tr>
            <tr
              style={{
                borderTop: '2px solid var(--border)',
                background: 'color-mix(in srgb, var(--text) 4%, var(--surface))',
              }}
            >
              <td
                className="rounded-bl-lg py-3 pr-2 pl-3 text-sm font-semibold"
                style={{ color: 'var(--text)' }}
              >
                Netto
              </td>
              <td className="py-3 px-1 text-right text-sm tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                {formatNOK(budgetNet)}
              </td>
              <td className="py-3 px-1 text-right text-sm tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                {formatNOK(actualNet)}
              </td>
              <td
                className="py-3 px-1 text-right text-sm tabular-nums font-semibold"
                style={{ color: varianceColor(varianceNet) }}
              >
                {varianceNet >= 0 ? '+' : ''}
                {formatNOK(varianceNet)}
              </td>
              <td
                className="rounded-br-lg py-3 pr-3 pl-1 text-right text-xs tabular-nums font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                {netPct ?? '–'}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div
        className="mt-6 rounded-xl pt-4"
        style={{
          borderTop: '1px solid var(--border)',
          ...(detailOpen ? { background: 'color-mix(in srgb, var(--surface) 94%, var(--text) 6%)' } : {}),
        }}
      >
        <button
          type="button"
          id="net-budget-detail-toggle"
          aria-expanded={detailOpen}
          aria-controls={detailPanelId}
          onClick={() => setDetailOpen((o) => !o)}
          className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-2 rounded-xl px-3 py-2 text-left outline-none transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-muted)]"
          style={{ color: 'var(--text)' }}
        >
          <span className="text-sm font-medium">Detaljert fordeling per kategori</span>
          <ChevronDown
            size={20}
            className="shrink-0 transition-transform duration-200"
            style={{
              color: 'var(--text-muted)',
              transform: detailOpen ? 'rotate(180deg)' : undefined,
            }}
            aria-hidden
          />
        </button>

        {detailOpen ? (
          <div
            id={detailPanelId}
            role="region"
            aria-labelledby="net-budget-detail-toggle"
            className="mt-2 max-h-[min(55vh,28rem)] min-w-0 space-y-8 overflow-y-auto overflow-x-auto overscroll-contain px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] touch-manipulation"
          >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <p
                id="net-budget-detail-summary"
                className="min-w-0 flex-1 text-xs leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {detailPanelSummary}
              </p>
              <select
                id="net-budget-detail-sort"
                value={detailSort}
                onChange={(e) => setDetailSort(e.target.value as DetailCategorySort)}
                aria-label="Sorter kategorier"
                aria-describedby="net-budget-detail-summary"
                className="min-h-[44px] w-full max-w-[min(100%,18rem)] shrink-0 cursor-pointer self-end rounded-lg border px-3 py-2 text-sm outline-none touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-muted)] sm:w-auto sm:max-w-xs sm:self-start"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              >
                {DETAIL_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <section className="min-w-0">
              <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Utgifter per kategori
                </p>
                <p className="text-[11px] leading-snug sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                  Samme kolonner som tabellen over. Trykk på en rad for detaljer.
                </p>
              </div>
              {expenseRows.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen utgiftslinjer i perioden.
                </p>
              ) : (
                <div
                  className="overflow-x-auto overscroll-x-auto touch-manipulation"
                >
                  <div
                    className="overflow-hidden rounded-lg border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="py-2.5 pl-3 pr-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                          Kategori
                        </th>
                        <th className="py-2.5 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Budsjett
                        </th>
                        <th className="py-2.5 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Faktisk
                        </th>
                        <th className="py-2.5 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Avvik
                        </th>
                        <th className="py-2.5 pr-3 pl-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Avvik %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {expenseRows.map((row) => {
                      const pct = variancePctVsBudget(row.budgeted, row.variance)
                      const open = () => onSelectExpenseCategory(row.name, row.actual)
                      return (
                        <tr
                          key={row.categoryId}
                          role="button"
                          tabIndex={0}
                          onClick={open}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              open()
                            }
                          }}
                          className="min-h-[44px] cursor-pointer touch-manipulation outline-none transition-colors hover:bg-black/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-muted)]"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          aria-label={`Åpne utgiftsdetaljer for ${row.name}`}
                        >
                          <td className="min-w-0 max-w-[min(45vw,11rem)] py-2.5 pr-2 pl-3 align-middle sm:max-w-none">
                            <span className="block break-words font-medium leading-snug" style={{ color: 'var(--text)' }}>
                              {row.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-1 text-right align-middle tabular-nums" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.budgeted)}
                          </td>
                          <td className="py-2.5 px-1 text-right align-middle tabular-nums" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.actual)}
                          </td>
                          <td
                            className="py-2.5 px-1 text-right align-middle tabular-nums font-medium"
                            style={{ color: categoryVarianceColor('expense', row.variance) }}
                          >
                            {row.variance >= 0 ? '+' : ''}
                            {formatNOK(row.variance)}
                          </td>
                          <td
                            className="py-2.5 pr-3 pl-1 text-right align-middle tabular-nums text-xs font-medium"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {pct ?? '–'}
                          </td>
                        </tr>
                      )
                    })}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </section>

            <section className="min-w-0">
              <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Inntekter per kategori
                </p>
                <p className="text-[11px] leading-snug sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                  Trykk på kategorinavnet for transaksjonslisten.
                </p>
              </div>
              {incomeRows.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen inntektslinjer i perioden.
                </p>
              ) : (
                <div className="overflow-x-auto overscroll-x-auto touch-manipulation">
                  <div
                    className="overflow-hidden rounded-lg border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="py-2.5 pl-3 pr-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                          Kategori
                        </th>
                        <th className="py-2.5 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Budsjett
                        </th>
                        <th className="py-2.5 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Faktisk
                        </th>
                        <th className="py-2.5 px-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Avvik
                        </th>
                        <th className="py-2.5 pr-3 pl-1 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Avvik %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {incomeRows.map((row) => {
                      const pct = variancePctVsBudget(row.budgeted, row.variance)
                      const href = transactionsListeHrefForCategory(periodMode, filterYear, monthIndex, row.name)
                      return (
                        <tr
                          key={row.categoryId}
                          className="min-h-[44px] transition-colors hover:bg-black/[0.035]"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td className="min-w-0 max-w-[min(45vw,11rem)] py-2.5 pr-2 pl-3 align-middle sm:max-w-none">
                            <Link
                              href={href}
                              className="inline-flex min-h-[44px] min-w-0 items-center rounded-md py-1 font-medium leading-snug underline-offset-2 transition-opacity hover:opacity-90 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-muted)] touch-manipulation"
                              style={{ color: 'var(--text)' }}
                            >
                              <span className="break-words">{row.name}</span>
                            </Link>
                          </td>
                          <td className="py-2.5 px-1 text-right align-middle tabular-nums" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.budgeted)}
                          </td>
                          <td className="py-2.5 px-1 text-right align-middle tabular-nums" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.actual)}
                          </td>
                          <td
                            className="py-2.5 px-1 text-right align-middle tabular-nums font-medium"
                            style={{ color: categoryVarianceColor('income', row.variance) }}
                          >
                            {row.variance >= 0 ? '+' : ''}
                            {formatNOK(row.variance)}
                          </td>
                          <td
                            className="py-2.5 pr-3 pl-1 text-right align-middle tabular-nums text-xs font-medium"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {pct ?? '–'}
                          </td>
                        </tr>
                      )
                    })}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
