'use client'

import { forwardRef } from 'react'
import { MONTH_LABELS_SHORT_NB, REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import { BUDGET_MONTH_LABELS } from '@/lib/budgetPeriod'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import {
  ctaGradientForUiPalette,
  normalizeUiColorPaletteId,
  uiPaletteCssVarsForExport,
  uiPaletteLabel,
  type UiColorPaletteId,
} from '@/lib/uiColorPalette'
import type { BudgetExportLayout, BudgetPlanScopePayload } from '@/lib/budgetPlanExport/types'

export type BudgetPlanDocumentProps = {
  generatedAt: Date
  year: number
  layout: BudgetExportLayout
  monthIndex: number
  uiColorPalette: UiColorPaletteId
  scopes: BudgetPlanScopePayload[]
}

const tableClass = 'w-full text-sm border-collapse'
const thClass = 'text-left py-2 px-2 font-semibold border-b'
const tdClass = 'py-2 px-2 border-b tabular-nums'

function periodLabel(layout: BudgetExportLayout, year: number, monthIndex: number): string {
  if (layout === 'fullYear') return `Hele kalenderåret ${year}`
  return `${BUDGET_MONTH_LABELS[monthIndex]} ${year}`
}

const BudgetPlanDocument = forwardRef<HTMLDivElement, BudgetPlanDocumentProps>(function BudgetPlanDocument(
  { generatedAt, year, layout, monthIndex, uiColorPalette, scopes },
  ref,
) {
  const { formatNOK } = useNokDisplayFormatters()
  const normalized = normalizeUiColorPaletteId(uiColorPalette)
  const paletteVars = uiPaletteCssVarsForExport(normalized)
  const paletteAttr = normalized === 'default' ? undefined : normalized

  return (
    <div
      ref={ref}
      className="budget-plan-document report-document mx-auto max-w-4xl rounded-2xl p-6 sm:p-8"
      data-ui-palette={paletteAttr}
      style={{
        ...paletteVars,
        background: 'var(--bg)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
      }}
    >
      {scopes.map((scope, scopeIndex) => (
        <section
          key={`${scope.scopeLabel}-${scopeIndex}`}
          className={scopeIndex > 0 ? 'budget-plan-scope mt-10 break-before-page' : ''}
        >
          <div
            className="rounded-xl px-4 py-3 mb-4 text-white"
            style={{ background: ctaGradientForUiPalette(normalized) }}
          >
            <h1 className="text-lg font-bold">Budsjettplan {year}</h1>
            <p className="text-sm opacity-95">{scope.scopeLabel}</p>
          </div>

          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Generert {generatedAt.toLocaleString('nb-NO')} fra Dottir · {periodLabel(layout, year, monthIndex)} ·
            Tema: {uiPaletteLabel(normalized)}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Budsjetterte inntekter', value: scope.kpis.budgetedIncome },
              { label: 'Budsjetterte kostnader', value: scope.kpis.budgetedExpense },
              {
                label: 'Resultat (budsjett)',
                value: scope.kpis.budgetResult,
                color: scope.kpis.budgetResult >= 0 ? 'var(--success)' : 'var(--danger)',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                <p className="text-lg font-bold" style={{ color: color ?? 'var(--text)' }}>
                  {formatNOK(value)}
                </p>
              </div>
            ))}
          </div>

          {REPORT_GROUP_ORDER.map((group) => {
            const rows = scope.rowsByGroup[group]
            if (!rows.length) return null
            const groupSum = rows.reduce((s, r) => s + (layout === 'fullYear' ? r.yearTotal : r.displayAmount), 0)
            return (
              <div key={group} className="mb-6">
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--primary)' }}>
                  {rows[0]?.groupLabel ?? group}
                </h3>
                <div className="overflow-x-auto">
                  <table className={tableClass} style={{ borderColor: 'var(--border)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', background: 'var(--primary-pale)' }}>
                        <th className={thClass} style={{ borderColor: 'var(--border)' }}>
                          Kategori
                        </th>
                        {layout === 'fullYear' ? (
                          MONTH_LABELS_SHORT_NB.map((m) => (
                            <th
                              key={m}
                              className={`${thClass} text-right`}
                              style={{ borderColor: 'var(--border)' }}
                            >
                              {m}
                            </th>
                          ))
                        ) : (
                          <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                            Beløp
                          </th>
                        )}
                        <th className={`${thClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                          Sum
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.name}>
                          <td className={tdClass} style={{ borderColor: 'var(--border)' }}>
                            {row.name}
                          </td>
                          {layout === 'fullYear' ? (
                            row.months.map((v, i) => (
                              <td
                                key={i}
                                className={`${tdClass} text-right`}
                                style={{ borderColor: 'var(--border)' }}
                              >
                                {v === 0 ? '—' : formatNOK(v)}
                              </td>
                            ))
                          ) : (
                            <td className={`${tdClass} text-right`} style={{ borderColor: 'var(--border)' }}>
                              {row.displayAmount === 0 ? '—' : formatNOK(row.displayAmount)}
                            </td>
                          )}
                          <td className={`${tdClass} text-right font-medium`} style={{ borderColor: 'var(--border)' }}>
                            {formatNOK(layout === 'fullYear' ? row.yearTotal : row.displayAmount)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--surface)' }}>
                        <td className={`${tdClass} font-semibold`} style={{ borderColor: 'var(--border)' }}>
                          Sum {rows[0]?.groupLabel}
                        </td>
                        {layout === 'fullYear' ? (
                          MONTH_LABELS_SHORT_NB.map((_, i) => {
                            const colSum = rows.reduce((s, r) => s + (r.months[i] ?? 0), 0)
                            return (
                              <td
                                key={i}
                                className={`${tdClass} text-right font-semibold`}
                                style={{ borderColor: 'var(--border)' }}
                              >
                                {colSum === 0 ? '—' : formatNOK(colSum)}
                              </td>
                            )
                          })
                        ) : (
                          <td className={`${tdClass} text-right font-semibold`} style={{ borderColor: 'var(--border)' }}>
                            {groupSum === 0 ? '—' : formatNOK(groupSum)}
                          </td>
                        )}
                        <td className={`${tdClass} text-right font-semibold`} style={{ borderColor: 'var(--border)' }}>
                          {formatNOK(groupSum)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
})

export default BudgetPlanDocument
