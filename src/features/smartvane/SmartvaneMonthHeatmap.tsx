'use client'

import type { CSSProperties } from 'react'
import type { DailySummaryPoint } from './insights'

const WD_SHORT_NO_MON = ['ma', 'ti', 'on', 'to', 'fr', 'lø', 'sø']

type Cell = DailySummaryPoint | 'pad'

function cellStyle(
  cell: Cell,
  hasDailyHabits: boolean,
  isToday: boolean,
): CSSProperties {
  const base: CSSProperties = {
    borderRadius: 8,
    border: '1px solid var(--border)',
    minHeight: 32,
    minWidth: 0,
  }
  if (isToday) {
    base.boxShadow = '0 0 0 2px var(--primary)'
  }
  if (cell === 'pad') {
    return { ...base, background: 'transparent', borderColor: 'transparent' }
  }
  if (!hasDailyHabits) {
    return { ...base, background: 'var(--primary-pale)', opacity: 0.5 }
  }
  if (cell.dailyGoalMet) {
    return { ...base, background: 'var(--success)', borderColor: 'color-mix(in srgb, var(--success) 70%, var(--border))' }
  }
  const r = cell.ratio
  if (r <= 0) {
    return { ...base, background: 'var(--surface)' }
  }
  if (r < 0.34) {
    return { ...base, background: 'color-mix(in srgb, var(--primary-pale) 40%, var(--surface))' }
  }
  if (r < 0.67) {
    return { ...base, background: 'var(--primary-pale)' }
  }
  return { ...base, background: 'color-mix(in srgb, var(--primary) 55%, var(--primary-pale))' }
}

function cellLabel(cell: Cell, hasDailyHabits: boolean): string {
  if (cell === 'pad') return ''
  if (!hasDailyHabits) return `${cell.date}: ingen daglige vaner`
  const pct = Math.round(cell.ratio * 100)
  return `${cell.date}: ${cell.dailyCompletedCount}/${cell.dailyHabitCount} vaner (${pct}%), ${cell.dailyGoalMet ? 'daglig mål nådd' : 'under mål'}`
}

export function SmartvaneMonthHeatmap(props: {
  points: DailySummaryPoint[]
  year: number
  month: number
  hasDailyHabits: boolean
  highlightYmd?: string | null
}) {
  const { points, year, month, hasDailyHabits, highlightYmd } = props

  const firstWd = new Date(year, month - 1, 1).getDay()
  const lead = (firstWd + 6) % 7
  const cells: Cell[] = [...Array.from({ length: lead }, (): Cell => 'pad'), ...points]
  while (cells.length % 7 !== 0) {
    cells.push('pad')
  }

  const rows: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }

  return (
    <div className="min-w-0" role="grid" aria-label="Månedsheatmap daglig aktivitet">
      <p className="text-xs font-medium m-0 mb-2" style={{ color: 'var(--text-muted)' }}>
        Heatmap måned — mørkere = mer krysset. Grønn = daglig mål nådd.
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', maxWidth: 420 }}
      >
        {WD_SHORT_NO_MON.map((abbr) => (
          <div
            key={abbr}
            className="text-[10px] font-semibold text-center uppercase tracking-wide pb-0.5 min-w-0"
            style={{ color: 'var(--text-muted)' }}
            aria-hidden
          >
            {abbr}
          </div>
        ))}
        {rows.flatMap((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri}-${ci}`
            if (cell === 'pad') {
              return (
                <div
                  key={key}
                  role="presentation"
                  className="rounded-lg min-h-[32px] min-w-0"
                  style={cellStyle('pad', hasDailyHabits, false)}
                />
              )
            }
            const isToday = !!(highlightYmd && cell.date === highlightYmd)
            return (
              <div
                key={key}
                role="gridcell"
                tabIndex={-1}
                title={cellLabel(cell, hasDailyHabits)}
                aria-label={cellLabel(cell, hasDailyHabits)}
                className="rounded-lg flex items-center justify-center text-[11px] font-semibold tabular-nums min-w-0 px-0.5"
                style={{
                  ...cellStyle(cell, hasDailyHabits, isToday),
                  color:
                    cell.dailyGoalMet && hasDailyHabits
                      ? '#fff'
                      : cell.ratio > 0.4 && hasDailyHabits
                        ? 'var(--text)'
                        : 'var(--text-muted)',
                }}
              >
                {Number(cell.date.slice(8, 10))}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
