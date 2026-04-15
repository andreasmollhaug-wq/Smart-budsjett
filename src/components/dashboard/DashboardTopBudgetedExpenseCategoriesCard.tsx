'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { variancePctVsBudget } from '@/lib/budgetVariancePct'
import { formatNOK } from '@/lib/utils'

type Props = {
  periodLabel: string
  rows: BudgetVsActualRow[]
  onSelectCategory: (categoryName: string, periodActual: number) => void
}

function expenseVarianceColor(variance: number): string {
  if (variance > 0) return 'var(--danger)'
  if (variance < 0) return 'var(--success)'
  return 'var(--text)'
}

function sortExpenseByBudgetThenName(a: BudgetVsActualRow, b: BudgetVsActualRow): number {
  return b.budgeted - a.budgeted || a.name.localeCompare(b.name, 'nb')
}

export default function DashboardTopBudgetedExpenseCategoriesCard({
  periodLabel,
  rows,
  onSelectCategory,
}: Props) {
  const [allOpen, setAllOpen] = useState(false)
  const allPanelId = 'top-budgeted-see-all-panel'
  const toggleId = 'top-budgeted-see-all-toggle'

  const topBudgeted = useMemo(() => {
    const list = rows.filter((r) => r.type === 'expense' && r.budgeted > 0)
    list.sort(sortExpenseByBudgetThenName)
    return list.slice(0, 10)
  }, [rows])

  /** Kvalitetssikring: alle utgifter med budsjett eller faktisk i perioden. */
  const allRelevantExpenses = useMemo(() => {
    const list = rows.filter(
      (r) => r.type === 'expense' && (r.budgeted > 0 || r.actual > 0),
    )
    list.sort(sortExpenseByBudgetThenName)
    return list
  }, [rows])

  /** Alltid tilgjengelig når det finnes rader å kvalitetssikre (ikke bare når >10). */
  const canShowFullList = allRelevantExpenses.length > 0

  return (
    <div
      className="min-w-0 w-full rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold leading-snug" style={{ color: 'var(--text)' }}>
        Topp 10 budsjetterte utgifter
      </h2>
      <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
        Rangert etter budsjettert beløp i perioden (ikke etter faktisk forbruk). {periodLabel}
      </p>
      {canShowFullList ? (
        <p className="mt-2 text-[11px] leading-snug sm:text-xs" style={{ color: 'var(--text-muted)' }}>
          Under tabellen: <span className="font-medium" style={{ color: 'var(--text)' }}>Se alle med budsjett eller faktisk</span>{' '}
          (pil ned) — full liste for gjennomgang.
        </p>
      ) : null}

      {topBudgeted.length === 0 && !canShowFullList ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen utgiftskategorier med budsjett eller faktisk i perioden.
        </p>
      ) : topBudgeted.length === 0 && canShowFullList ? (
        <p className="mt-4 text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
          Ingen budsjetterte beløp i topp 10-filteret, men du har utgifter i perioden. Bruk «Se alle» under for full liste.
        </p>
      ) : (
        <>
          <p className="mt-4 text-[11px] leading-snug sm:hidden" style={{ color: 'var(--text-muted)' }}>
            Sveip sideveis for alle kolonner.
          </p>
          <div className="mt-2 min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x max-sm:-mx-4 max-sm:px-4 sm:mx-0 sm:mt-4">
            <div
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <table className="w-full min-w-[480px] border-collapse text-sm">
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
                  {topBudgeted.map((row, index) => {
                    const rank = index + 1
                    const pct = variancePctVsBudget(row.budgeted, row.variance)
                    const open = () => onSelectCategory(row.name, row.actual)
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
                        aria-label={`Åpne detaljer for ${rank}. ${row.name}`}
                      >
                        <td className="min-w-0 max-w-[min(45vw,12rem)] py-2.5 pr-2 pl-3 align-middle sm:max-w-none">
                          <span className="block break-words font-medium leading-snug" style={{ color: 'var(--text)' }}>
                            <span
                              className="mr-1.5 inline-block min-w-[1.25rem] tabular-nums text-xs font-semibold sm:text-sm"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {rank}.
                            </span>
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
                          style={{ color: expenseVarianceColor(row.variance) }}
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
        </>
      )}
      {topBudgeted.length > 0 ? (
        <p className="mt-3 text-[11px] leading-snug sm:text-xs" style={{ color: 'var(--text-muted)' }}>
          Trykk på en rad for månedsfordeling, transaksjoner og husholdning (der det gjelder).
        </p>
      ) : null}

      {canShowFullList ? (
        <div
          className="mt-6 rounded-xl pt-4"
          style={{
            borderTop: '1px solid var(--border)',
            ...(allOpen ? { background: 'color-mix(in srgb, var(--surface) 94%, var(--text) 6%)' } : {}),
          }}
        >
          <button
            type="button"
            id={toggleId}
            aria-expanded={allOpen}
            aria-controls={allPanelId}
            onClick={() => setAllOpen((o) => !o)}
            className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-2 rounded-xl px-3 py-2 text-left outline-none transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-muted)]"
            style={{ color: 'var(--text)' }}
          >
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
              Se alle med budsjett eller faktisk
              <span className="mt-0.5 block text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                {allRelevantExpenses.length} {allRelevantExpenses.length === 1 ? 'kategori' : 'kategorier'} · trykk for å
                utvide
              </span>
            </span>
            <ChevronDown
              size={20}
              className="shrink-0 transition-transform duration-200"
              style={{
                color: 'var(--text-muted)',
                transform: allOpen ? 'rotate(180deg)' : undefined,
              }}
              aria-hidden
            />
          </button>
          {allOpen ? (
            <div
              id={allPanelId}
              role="region"
              aria-labelledby={toggleId}
              className="mt-2 max-h-[min(50vh,24rem)] min-w-0 overflow-y-auto overscroll-contain px-3 pb-2 pt-1 touch-manipulation"
            >
              <p className="mb-3 text-[11px] leading-snug sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                Alle utgiftskategorier i perioden der det er budsjettert beløp eller registrert faktisk utgift — for
                gjennomgang.
              </p>
              <p className="mb-2 text-[11px] leading-snug sm:hidden" style={{ color: 'var(--text-muted)' }}>
                Sveip sideveis for alle kolonner.
              </p>
              <div className="min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x max-sm:-mx-3 max-sm:px-3 sm:mx-0">
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <table className="w-full min-w-[480px] border-collapse text-sm">
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
                      {allRelevantExpenses.map((row, index) => {
                        const rank = index + 1
                        const pct = variancePctVsBudget(row.budgeted, row.variance)
                        const open = () => onSelectCategory(row.name, row.actual)
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
                            aria-label={`Åpne detaljer for ${rank}. ${row.name}`}
                          >
                            <td className="min-w-0 max-w-[min(45vw,12rem)] py-2.5 pr-2 pl-3 align-middle sm:max-w-none">
                              <span className="block break-words font-medium leading-snug" style={{ color: 'var(--text)' }}>
                                <span
                                  className="mr-1.5 inline-block min-w-[1.25rem] tabular-nums text-xs font-semibold sm:text-sm"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {rank}.
                                </span>
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
                              style={{ color: expenseVarianceColor(row.variance) }}
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
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
