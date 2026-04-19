'use client'

import { Fragment } from 'react'
import {
  MONTH_LABELS_SHORT_NB,
  REPORT_GROUP_LABELS,
  REPORT_GROUP_ORDER,
} from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import {
  ARSVISNING_ROW_LABELS,
  ARSVISNING_ROW_ORDER,
  buildGroupAggregateMonthArrays,
  formatMatrixCell,
  formatMatrixSummary,
  isCalendarFutureMonth,
  parentCategoryToAggregateLineType,
  varianceCellBackground,
  varianceCssColor,
  type ArsvisningRowVisibility,
} from '@/lib/budgetYearMatrixHelpers'
import type { BudgetCategory } from '@/lib/store'

function isMonthInKpiRange(m: number, start: number, end: number): boolean {
  return m >= start && m <= end
}

export default function BudgetYearMatrixTable({
  categoriesByParent,
  actualMatrix,
  budgetMatrix,
  kpiMonthStart,
  kpiMonthEnd,
  rowVisibility,
  year,
}: {
  categoriesByParent: Record<ParentCategory, BudgetCategory[]>
  actualMatrix: Map<string, number[]>
  budgetMatrix: Map<string, number[]>
  kpiMonthStart: number
  kpiMonthEnd: number
  rowVisibility: ArsvisningRowVisibility
  year: number
}) {
  const cellBase = 'py-2 px-1.5 sm:px-2 text-right text-xs sm:text-sm whitespace-nowrap border-b tabular-nums'
  /** Første kolonne: alltid venstrejustert (ikke arv `text-right` fra tallceller). */
  const stickyLineCol =
    'py-2 px-1.5 sm:px-2 text-left align-top text-xs sm:text-sm border-b sticky left-0 z-[2] min-w-[9rem] max-w-[min(46vw,14rem)] sm:max-w-[15rem] sm:min-w-[11rem]'
  const thLineHeader = `${stickyLineCol} font-semibold`
  const dimClass = 'opacity-[0.38]'
  const summaryTh =
    'py-2 px-1.5 sm:px-2 text-right text-xs font-semibold border-b whitespace-nowrap border-l-2'
  const summaryTd = 'py-2 px-1.5 sm:px-2 text-right text-xs sm:text-sm whitespace-nowrap border-b border-l-2 tabular-nums'

  const activeRows = ARSVISNING_ROW_ORDER.filter((k) => rowVisibility[k])

  return (
    <div className="space-y-8 w-full min-w-0">
      {REPORT_GROUP_ORDER.map((group) => {
        const cats = categoriesByParent[group]
        if (!cats.length) return null

        const { actual: aggActual, budget: aggBudget } = buildGroupAggregateMonthArrays(
          cats,
          actualMatrix,
          budgetMatrix,
        )
        const aggLineType = parentCategoryToAggregateLineType(group)

        return (
          <div key={group} className="min-w-0">
            <h4 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
              {REPORT_GROUP_LABELS[group]}
            </h4>
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
                      className={thLineHeader}
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
                              ? {
                                  background:
                                    'color-mix(in srgb, var(--border) 18%, var(--bg))',
                                }
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
                      title="Snitt per måned over tolv måneder (hele kalenderåret)"
                    >
                      <span className="sm:hidden">Snitt</span>
                      <span className="hidden sm:inline">Snitt (12 mnd)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cats.map((c) => {
                    const actual = actualMatrix.get(c.name)
                    const budget = budgetMatrix.get(c.name)
                    const type = c.type

                    return (
                      <Fragment key={c.id}>
                        {activeRows.map((kind) => {
                          const isVarianceKind = kind === 'variance' || kind === 'variancePct'
                          const summary = formatMatrixSummary(kind, type, actual, budget)
                          return (
                            <tr key={`${c.id}-${kind}`}>
                              <td
                                className={`${stickyLineCol} ${kind === 'actual' ? 'font-medium' : ''}`}
                                style={{
                                  borderColor: 'var(--border)',
                                  background: kind === 'actual' ? 'var(--bg)' : 'var(--surface)',
                                  color: kind === 'actual' ? 'var(--text)' : 'var(--text-muted)',
                                  boxShadow:
                                    '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                                }}
                              >
                                <span
                                  className="line-clamp-3 break-words [overflow-wrap:anywhere]"
                                  title={`${c.name} · ${ARSVISNING_ROW_LABELS[kind]}`}
                                >
                                  {c.name} · {ARSVISNING_ROW_LABELS[kind]}
                                </span>
                              </td>
                              {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                                const kpiDim =
                                  !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                                const future = isCalendarFutureMonth(year, mi)
                                const cell = formatMatrixCell(kind, type, actual, budget, mi)
                                const tone = cell.tone
                                const textColor = tone ? varianceCssColor(tone) : undefined
                                const varBg =
                                  isVarianceKind && tone && tone !== 'muted'
                                    ? varianceCellBackground(tone)
                                    : undefined
                                const futureBg = future
                                  ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                                  : undefined
                                let monthBg: string | undefined
                                if (varBg) monthBg = varBg
                                else if (futureBg) monthBg = futureBg
                                return (
                                  <td
                                    key={`${kind}-${mi}`}
                                    className={`${cellBase} ${kpiDim}`}
                                    style={{
                                      borderColor: 'var(--border)',
                                      color: textColor ?? (kind === 'budget' ? 'var(--text-muted)' : 'var(--text)'),
                                      background: monthBg,
                                    }}
                                  >
                                    {cell.text}
                                  </td>
                                )
                              })}
                              <td
                                className={summaryTd}
                                style={{
                                  borderColor: 'var(--border)',
                                  borderLeftColor: 'var(--primary)',
                                  background:
                                    isVarianceKind && summary.sumTone === 'good'
                                      ? 'color-mix(in srgb, var(--success) 16%, var(--primary-pale))'
                                      : 'var(--primary-pale)',
                                  color: summary.sumTone
                                    ? varianceCssColor(summary.sumTone)
                                    : 'var(--text)',
                                }}
                              >
                                {summary.sumText}
                              </td>
                              <td
                                className={summaryTd}
                                style={{
                                  borderColor: 'var(--border)',
                                  borderLeftColor: 'var(--border)',
                                  background:
                                    isVarianceKind && summary.avgTone === 'good'
                                      ? 'color-mix(in srgb, var(--success) 16%, var(--primary-pale))'
                                      : 'var(--primary-pale)',
                                  color: summary.avgTone
                                    ? varianceCssColor(summary.avgTone)
                                    : 'var(--text-muted)',
                                }}
                              >
                                {summary.avgText}
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                  {activeRows.map((kind) => {
                    const isVarianceKind = kind === 'variance' || kind === 'variancePct'
                    const summary = formatMatrixSummary(kind, aggLineType, aggActual, aggBudget)
                    return (
                      <tr key={`sum-${group}-${kind}`} style={{ color: 'var(--text-muted)' }}>
                        <td
                          className={`${stickyLineCol} font-medium`}
                          style={{
                            borderColor: 'var(--border)',
                            background: 'color-mix(in srgb, var(--surface) 88%, var(--bg))',
                            boxShadow:
                              '4px 0 8px -4px color-mix(in srgb, var(--border) 40%, transparent)',
                          }}
                        >
                          <span
                            className="line-clamp-2 break-words [overflow-wrap:anywhere]"
                            title={`Sum ${REPORT_GROUP_LABELS[group]} · ${ARSVISNING_ROW_LABELS[kind]}`}
                          >
                            Sum · {ARSVISNING_ROW_LABELS[kind]}
                          </span>
                        </td>
                        {MONTH_LABELS_SHORT_NB.map((_, mi) => {
                          const kpiDim =
                            !isMonthInKpiRange(mi, kpiMonthStart, kpiMonthEnd) ? dimClass : ''
                          const future = isCalendarFutureMonth(year, mi)
                          const cell = formatMatrixCell(kind, aggLineType, aggActual, aggBudget, mi)
                          const tone = cell.tone
                          const textColor = tone ? varianceCssColor(tone) : undefined
                          const varBg =
                            isVarianceKind && tone && tone !== 'muted'
                              ? varianceCellBackground(tone)
                              : undefined
                          const futureBg = future
                            ? 'color-mix(in srgb, var(--border) 12%, var(--bg))'
                            : undefined
                          let monthBg: string | undefined
                          if (varBg) monthBg = varBg
                          else if (futureBg) monthBg = futureBg
                          return (
                            <td
                              key={`sum-${group}-${kind}-${mi}`}
                              className={`${cellBase} ${kpiDim} font-medium`}
                              style={{
                                borderColor: 'var(--border)',
                                color: textColor ?? (kind === 'budget' ? 'var(--text-muted)' : 'var(--text-muted)'),
                                background:
                                  monthBg ??
                                  'color-mix(in srgb, var(--surface) 88%, var(--bg))',
                              }}
                            >
                              {cell.text}
                            </td>
                          )
                        })}
                        <td
                          className={`${summaryTd} font-medium`}
                          style={{
                            borderColor: 'var(--border)',
                            borderLeftColor: 'var(--primary)',
                            background:
                              isVarianceKind && summary.sumTone === 'good'
                                ? 'color-mix(in srgb, var(--success) 16%, var(--primary-pale))'
                                : 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                            color: summary.sumTone
                              ? varianceCssColor(summary.sumTone)
                              : 'var(--text-muted)',
                          }}
                        >
                          {summary.sumText}
                        </td>
                        <td
                          className={`${summaryTd} font-medium`}
                          style={{
                            borderColor: 'var(--border)',
                            borderLeftColor: 'var(--border)',
                            background:
                              isVarianceKind && summary.avgTone === 'good'
                                ? 'color-mix(in srgb, var(--success) 16%, var(--primary-pale))'
                                : 'color-mix(in srgb, var(--surface) 70%, var(--primary-pale))',
                            color: summary.avgTone
                              ? varianceCssColor(summary.avgTone)
                              : 'var(--text-muted)',
                          }}
                        >
                          {summary.avgText}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
