'use client'

import type { PeriodMode } from '@/lib/budgetPeriod'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']

type Props = {
  filterYear: number
  onFilterYearChange: (y: number) => void
  periodMode: PeriodMode
  onPeriodModeChange: (m: PeriodMode) => void
  monthIndex: number
  onMonthIndexChange: (m: number) => void
  yearOptions: number[]
}

/** min-h 44px ≈ anbefalt touch-mål; full bredde på små skjermer så ingenting blir smalt/uklikkbart */
const selectClass =
  'min-h-[44px] w-full min-w-0 px-3 py-2.5 text-sm rounded-xl touch-manipulation sm:w-auto sm:min-w-[10rem]'
const selectStyle = { border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' } as const

export default function DashboardPeriodToolbar({
  filterYear,
  onFilterYearChange,
  periodMode,
  onPeriodModeChange,
  monthIndex,
  onMonthIndexChange,
  yearOptions,
}: Props) {
  const showMonthPicker = periodMode === 'month' || periodMode === 'ytd'

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <span className="shrink-0 text-sm" style={{ color: 'var(--text-muted)' }}>
          Vis:
        </span>
        <select
          value={filterYear}
          onChange={(e) => onFilterYearChange(Number(e.target.value))}
          className={`${selectClass} sm:min-w-[6rem]`}
          style={selectStyle}
          aria-label="År"
        >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
        </select>
      </div>
      <select
        value={periodMode}
        onChange={(e) => onPeriodModeChange(e.target.value as PeriodMode)}
        className={selectClass}
        style={selectStyle}
        aria-label="Periode"
      >
        <option value="ytd">Hittil i år</option>
        <option value="month">Én måned</option>
        <option value="year">Hele året</option>
      </select>
      {showMonthPicker && (
        <select
          value={monthIndex}
          onChange={(e) => onMonthIndexChange(Number(e.target.value))}
          className={selectClass}
          style={selectStyle}
          aria-label={periodMode === 'ytd' ? 'T.o.m. måned' : 'Måned'}
        >
          {MONTHS_SHORT.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
