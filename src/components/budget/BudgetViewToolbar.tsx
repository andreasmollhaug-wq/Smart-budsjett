'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { BudgetExportSubject } from '@/lib/budgetPlanExport/types'

const BudgetExportMenu = dynamic(() => import('@/components/budget/BudgetExportMenu'), { ssr: false })

const MONTHS_FULL = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
]

type BudgetView = 'year' | 'month'

type Props = {
  view: BudgetView
  onViewChange: (view: BudgetView) => void
  viewingYear: number
  onViewingYearChange: (year: number) => void
  yearOptions: number[]
  budgetYear: number
  onStartNewYear: () => void
  selectedMonth: number
  onSelectedMonthChange: (month: number) => void
  exportDefaultSubject: BudgetExportSubject
}

function ViewToggle({ view, onViewChange }: { view: BudgetView; onViewChange: (v: BudgetView) => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
      {(['year', 'month'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onViewChange(v)}
          className="px-4 py-2 text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
          style={{
            background: view === v ? 'var(--primary)' : 'var(--surface)',
            color: view === v ? 'white' : 'var(--text-muted)',
          }}
        >
          {v === 'month' ? 'Månedlig' : 'Årlig'}
        </button>
      ))}
    </div>
  )
}

function YearSelect({
  viewingYear,
  onViewingYearChange,
  yearOptions,
  budgetYear,
  id,
}: {
  viewingYear: number
  onViewingYearChange: (year: number) => void
  yearOptions: number[]
  budgetYear: number
  id?: string
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>
        Budsjettår:
      </span>
      <select
        id={id}
        value={viewingYear}
        onChange={(e) => onViewingYearChange(Number(e.target.value))}
        className="px-3 py-2 text-sm rounded-xl min-w-[5rem] min-h-[44px] touch-manipulation"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
            {y === budgetYear ? ' (aktivt)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function MonthSelect({
  selectedMonth,
  onSelectedMonthChange,
}: {
  selectedMonth: number
  onSelectedMonthChange: (month: number) => void
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>
        Måned:
      </span>
      <select
        value={selectedMonth}
        onChange={(e) => onSelectedMonthChange(Number(e.target.value))}
        className="px-3 py-2 text-sm rounded-xl min-h-[44px] touch-manipulation"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        aria-label="Velg måned for budsjettvisning"
      >
        {MONTHS_FULL.map((m, i) => (
          <option key={i} value={i}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}

function StartNewYearButton({
  onStartNewYear,
  compact,
}: {
  onStartNewYear: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onStartNewYear}
      className={
        compact
          ? 'text-sm font-medium min-h-[44px] touch-manipulation text-left'
          : 'px-3 py-2 text-sm font-medium rounded-xl min-h-[44px] touch-manipulation'
      }
      style={compact ? { color: 'var(--primary)' } : { border: '1px solid var(--border)', color: 'var(--primary)' }}
    >
      Start nytt budsjettår
    </button>
  )
}

function ExportMenu({
  viewingYear,
  view,
  selectedMonth,
  exportDefaultSubject,
}: {
  viewingYear: number
  view: BudgetView
  selectedMonth: number
  exportDefaultSubject: BudgetExportSubject
}) {
  return (
    <BudgetExportMenu
      year={viewingYear}
      layout={view === 'year' ? 'fullYear' : 'singleMonth'}
      monthIndex={selectedMonth}
      defaultSubject={exportDefaultSubject}
      onlyLinesWithAmounts={false}
    />
  )
}

export default function BudgetViewToolbar({
  view,
  onViewChange,
  viewingYear,
  onViewingYearChange,
  yearOptions,
  budgetYear,
  onStartNewYear,
  selectedMonth,
  onSelectedMonthChange,
  exportDefaultSubject,
}: Props) {
  const [extrasOpen, setExtrasOpen] = useState(false)

  const yearSummary =
    viewingYear === budgetYear ? `Budsjettår ${viewingYear} (aktivt)` : `Budsjettår ${viewingYear}`

  return (
    <>
      {/* Mobil */}
      <div className="md:hidden space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <ViewToggle view={view} onViewChange={onViewChange} />
          {view === 'month' ? (
            <MonthSelect selectedMonth={selectedMonth} onSelectedMonthChange={onSelectedMonthChange} />
          ) : null}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <button
            type="button"
            onClick={() => setExtrasOpen((open) => !open)}
            className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-left text-sm touch-manipulation"
            aria-expanded={extrasOpen}
          >
            <span className="min-w-0 flex flex-col gap-0.5">
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Flere innstillinger
              </span>
              {!extrasOpen ? (
                <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {yearSummary}
                </span>
              ) : null}
            </span>
            {extrasOpen ? (
              <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
            ) : (
              <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
            )}
          </button>

          {extrasOpen ? (
            <div
              className="space-y-2 border-t px-3 py-2.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <label
                  htmlFor="budget-view-year-mobile"
                  className="text-sm shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Budsjettår:
                </label>
                <select
                  id="budget-view-year-mobile"
                  value={viewingYear}
                  onChange={(e) => onViewingYearChange(Number(e.target.value))}
                  className="min-w-0 flex-1 px-3 py-2 text-sm rounded-xl min-h-[44px] touch-manipulation"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                      {y === budgetYear ? ' (aktivt)' : ''}
                    </option>
                  ))}
                </select>
                <ExportMenu
                  viewingYear={viewingYear}
                  view={view}
                  selectedMonth={selectedMonth}
                  exportDefaultSubject={exportDefaultSubject}
                />
              </div>
              {viewingYear === budgetYear ? (
                <StartNewYearButton onStartNewYear={onStartNewYear} compact />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Desktop — uendret layout */}
      <div className="hidden md:flex flex-wrap justify-between items-center gap-4 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle view={view} onViewChange={onViewChange} />
          <YearSelect
            viewingYear={viewingYear}
            onViewingYearChange={onViewingYearChange}
            yearOptions={yearOptions}
            budgetYear={budgetYear}
          />
          {viewingYear === budgetYear ? <StartNewYearButton onStartNewYear={onStartNewYear} /> : null}
          <ExportMenu
            viewingYear={viewingYear}
            view={view}
            selectedMonth={selectedMonth}
            exportDefaultSubject={exportDefaultSubject}
          />
        </div>

        {view === 'month' ? (
          <MonthSelect selectedMonth={selectedMonth} onSelectedMonthChange={onSelectedMonthChange} />
        ) : null}
      </div>
    </>
  )
}
