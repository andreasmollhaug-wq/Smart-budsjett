'use client'

import { MatHandlelisteCollapsiblePanel } from '@/components/matHandleliste/MatHandlelisteCollapsiblePanel'
import { calendarGridForMonth, summarizeMonthPlanCalendarMonth } from '@/features/matHandleliste/planHelpers'
import type { DayPlan, MealSlotId } from '@/features/matHandleliste/types'
import { useMemo, type CSSProperties } from 'react'

const DOW_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'] as const

function heatmapDayStyle(filled: number, maxSlots: number): CSSProperties {
  if (maxSlots <= 0) {
    return { background: 'var(--surface)' }
  }
  const t = Math.min(1, Math.max(0, filled / maxSlots))
  const mixPct = Math.round(22 + t * 58)
  return {
    background: `color-mix(in srgb, var(--primary) ${mixPct}%, var(--surface))`,
  }
}

type Props = {
  year: number
  monthIndex0: number
  planByDate: Record<string, DayPlan>
  visibleSlots: MealSlotId[]
}

export function MatHandlelisteMonthInsights({ year, monthIndex0, planByDate, visibleSlots }: Props) {
  const summary = useMemo(
    () => summarizeMonthPlanCalendarMonth(year, monthIndex0, planByDate, visibleSlots),
    [year, monthIndex0, planByDate, visibleSlots],
  )

  const heatmapGrid = useMemo(() => calendarGridForMonth(year, monthIndex0), [year, monthIndex0])

  const fillPctTotal =
    summary.totalPossibleSlots > 0
      ? Math.round((100 * summary.totalFilledSlots) / summary.totalPossibleSlots)
      : null

  return (
    <MatHandlelisteCollapsiblePanel title="Innsikt denne måneden" defaultOpen={false}>
      <div className="min-w-0 space-y-3">
        <div className="space-y-1 text-sm leading-relaxed">
          <p style={{ color: 'var(--text)' }}>
            <strong>{summary.daysWithAnyPlan}</strong> av <strong>{summary.daysInMonth}</strong> dager har minst ett
            planlagt måltid (blant dine valgte tidsrom).
          </p>
          {fillPctTotal !== null ? (
            <p style={{ color: 'var(--text-muted)' }}>
              <strong>{fillPctTotal} %</strong> av alle mulige måltidsplasser denne måneden er valgt ({summary.totalFilledSlots}{' '}
              av {summary.totalPossibleSlots}).
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              Velg hvilke tidsrom som skal vises i planen for å bruke måltidsdekning på tvers av måneden.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Dekning heatmap (samme måned som kalender ovenfor)
          </p>
          <div
            className="rounded-xl border p-2"
            style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--primary-pale) 28%, var(--surface))' }}
            aria-label="Heatmap som viser hvor godt månedens dager er fylt i valgte tidsrom. Lysere bakgrunn betyr færre måltidsplasser lagt inn; mørkere betyr flere. Tallene forklares i KPI-teksten over."
            role="img"
          >
            <div
              className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold sm:text-[11px]"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden
            >
              {DOW_LABELS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            {heatmapGrid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-0.5">
                {row.map((cell) => {
                  if (!cell.inMonth) {
                    return (
                      <div
                        key={cell.key}
                        className="aspect-square max-w-[3.5rem] min-h-0 min-w-0 shrink-0 sm:max-w-none sm:aspect-auto sm:min-h-[40px]"
                        aria-hidden
                      />
                    )
                  }
                  const bucket = summary.byDateKey[cell.key]!
                  const filled = bucket.filled
                  const showMax = bucket.max
                  return (
                    <div
                      key={cell.key}
                      className="flex aspect-square max-w-[3.5rem] min-h-0 min-w-0 flex-col items-center justify-center rounded-md px-0.5 py-1 sm:max-w-none sm:aspect-auto sm:min-h-[40px]"
                      style={heatmapDayStyle(filled, showMax)}
                      title={`${cell.key}: ${filled}${showMax > 0 ? ` / ${showMax}` : ''} tidsrom`}
                    >
                      <span className="text-[11px] font-semibold tabular-nums leading-none sm:text-xs" style={{ color: 'var(--text)' }}>
                        {filled}
                      </span>
                      {showMax > 0 ? (
                        <span className="text-[9px] tabular-nums leading-none opacity-80" style={{ color: 'var(--text-muted)' }}>
                          /{showMax}
                        </span>
                      ) : (
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                          —
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Tall = filled / antall aktive tidsrom. Lysere bakgrunn = lite planlagt; sterkere farge = mer av måltidsdagens
              plasser er brukt (etter dine valgte tidsrom under plan · innstillinger).
            </p>
          </div>
        </div>
      </div>
    </MatHandlelisteCollapsiblePanel>
  )
}
