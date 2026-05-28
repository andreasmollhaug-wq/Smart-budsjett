'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import { periodSubtitle, type PeriodMode } from '@/lib/budgetPeriod'

type Props = {
  filterYear: number
  onFilterYearChange: (y: number) => void
  periodMode: PeriodMode
  onPeriodModeChange: (m: PeriodMode) => void
  monthIndex: number
  onMonthIndexChange: (m: number) => void
  yearOptions: number[]
}

export default function DashboardPeriodToolbarCollapsible({
  filterYear,
  onFilterYearChange,
  periodMode,
  onPeriodModeChange,
  monthIndex,
  onMonthIndexChange,
  yearOptions,
}: Props) {
  const [open, setOpen] = useState(false)

  const summary = periodSubtitle(periodMode, filterYear, monthIndex)

  const toolbarProps = {
    filterYear,
    onFilterYearChange,
    periodMode,
    onPeriodModeChange,
    monthIndex,
    onMonthIndexChange,
    yearOptions,
    variant: 'default' as const,
  }

  return (
    <>
      <div
        className="md:hidden rounded-xl overflow-hidden min-w-0"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-left text-sm touch-manipulation"
          aria-expanded={open}
        >
          <span className="min-w-0 flex flex-col gap-0.5">
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              Periode
            </span>
            {!open ? (
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {summary}
              </span>
            ) : null}
          </span>
          {open ? (
            <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          ) : (
            <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          )}
        </button>

        {open ? (
          <div className="border-t px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
            <DashboardPeriodToolbar {...toolbarProps} />
          </div>
        ) : null}
      </div>

      <div className="hidden md:block min-w-0">
        <DashboardPeriodToolbar {...toolbarProps} />
      </div>
    </>
  )
}
