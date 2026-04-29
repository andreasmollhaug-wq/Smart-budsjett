'use client'

import Header from '@/components/layout/Header'
import MatHandlelisteBudgetCard from '@/components/matHandleliste/MatHandlelisteBudgetCard'
import { MatHandlelisteDayPlanModal } from '@/components/matHandleliste/MatHandlelisteDayPlanModal'
import { MatHandlelisteMonthInsights } from '@/components/matHandleliste/MatHandlelisteMonthInsights'
import { MatHandlelisteAppendRangeDialog } from '@/features/matHandleliste/MatHandlelisteAppendDialog'
import { MatHandlelistePageShell } from '@/features/matHandleliste/MatHandlelistePageShell'
import {
  calendarGridForMonth,
  collectIngredientLinesFromPlanRange,
  dayHasPlannedMeals,
  monthDateRangeKeys,
  summarizeLinesForDialog,
} from '@/features/matHandleliste/planHelpers'
import { useStore } from '@/lib/store'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { MealSlotId } from '@/features/matHandleliste/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DOW = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

export function MatHandlelisteMonthPage() {
  const planByDate = useStore((s) => s.matHandleliste.planByDate)
  const meals = useStore((s) => s.matHandleliste.meals)
  const planVisibleSlots = useStore((s) => s.matHandleliste.settings.planVisibleSlots) as MealSlotId[]
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [appendOpen, setAppendOpen] = useState(false)
  const [rangeLines, setRangeLines] = useState<{ normalizedKey: string; displayName: string }[]>([])
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')

  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  const title = cursor.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })

  const grid = useMemo(() => calendarGridForMonth(y, m), [y, m])

  const mealMap = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals])

  const mealTitlesById = useMemo(() => {
    const m = new Map<string, string>()
    for (const meal of meals) m.set(meal.id, meal.title)
    return m
  }, [meals])

  const monthKeys = useMemo(() => monthDateRangeKeys(y, m), [y, m])

  function openAppendMonth() {
    const st = useStore.getState().matHandleliste
    const lines = collectIngredientLinesFromPlanRange(st, monthKeys, mealMap, {
      slots: st.settings.planVisibleSlots,
    })
    setRangeLines(summarizeLinesForDialog(lines))
    setRangeFrom(monthKeys[0] ?? '')
    setRangeTo(monthKeys[monthKeys.length - 1] ?? '')
    setAppendOpen(true)
  }

  function prevMonth() {
    setCursor(new Date(y, m - 1, 1))
  }
  function nextMonth() {
    setCursor(new Date(y, m + 1, 1))
  }
  function goToday() {
    setCursor(new Date())
  }

  const todayKey = useMemo(() => {
    const t = new Date()
    const mm = String(t.getMonth() + 1).padStart(2, '0')
    const dd = String(t.getDate()).padStart(2, '0')
    return `${t.getFullYear()}-${mm}-${dd}`
  }, [])

  return (
    <>
      <Header title="Måned" subtitle="Oversikt over planlagte måltider" />
      <MatHandlelistePageShell>
        <div className="w-full max-w-none space-y-4 pb-8">
          <MatHandlelisteBudgetCard />
          <div data-mh-tour="plan-month-overview" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Forrige måned"
                className="flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                onClick={prevMonth}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label="Neste måned"
                className="flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                onClick={nextMonth}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>
              {title}
            </p>
            <button
              type="button"
              onClick={goToday}
              className="min-h-[44px] rounded-xl border px-3 text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
            >
              I dag
            </button>
            </div>

            <Link
            href="/intern/mat-handleliste/plan"
            className="inline-block text-sm font-medium underline"
            style={{ color: 'var(--primary)' }}
          >
            Til ukeplan
            </Link>

            <button
            type="button"
            onClick={openAppendMonth}
            className="w-full min-h-[48px] rounded-xl text-sm font-semibold text-white touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Legg hele måneden på handleliste
            </button>

            <div className="rounded-xl border p-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold sm:text-xs" style={{ color: 'var(--text-muted)' }}>
              {DOW.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            {grid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-0.5">
                {row.map((cell) => {
                  const planned = dayHasPlannedMeals(planByDate[cell.key])
                  const isToday = cell.key === todayKey
                  const emptyDay = cell.inMonth && !planned
                  const content = (
                    <div
                      className="flex min-h-[44px] flex-col items-center justify-center rounded-lg py-1 text-sm tabular-nums"
                      style={{
                        background: cell.inMonth ? 'var(--bg)' : 'transparent',
                        color: cell.inMonth ? 'var(--text)' : 'var(--text-muted)',
                        opacity: cell.inMonth ? 1 : 0.45,
                        outline: isToday ? '2px solid var(--primary)' : undefined,
                        border: emptyDay ? '1px dashed color-mix(in srgb, var(--border) 85%, transparent)' : undefined,
                        boxSizing: 'border-box',
                      }}
                    >
                      <span>{cell.key.slice(8)}</span>
                      {planned ? (
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--primary)' }} aria-hidden />
                      ) : (
                        <span
                          className="mt-0.5 h-1.5 w-1.5 rounded-full border border-dashed"
                          style={{ borderColor: 'var(--text-muted)', opacity: cell.inMonth ? 0.55 : 0.35 }}
                          aria-hidden
                        />
                      )}
                      <span className="sr-only">{planned ? 'Har plan' : 'Ingen plan'}</span>
                    </div>
                  )
                  if (!cell.inMonth) return <div key={cell.key}>{content}</div>
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className="block w-full cursor-pointer touch-manipulation rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{ background: 'transparent', border: 'none', padding: 0 }}
                      onClick={() => setSelectedDateKey(cell.key)}
                      aria-label={`${cell.key}: vis planlagte måltider for dagen`}
                    >
                      {content}
                    </button>
                  )
                })}
              </div>
            ))}
            </div>
          </div>

          <MatHandlelisteMonthInsights
            year={y}
            monthIndex0={m}
            planByDate={planByDate}
            visibleSlots={planVisibleSlots}
          />

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Fylt prikk = minst ett måltid planlagt. Stiplet ring = ingen plan den dagen. Stiplet ramme rundt cellen = ledig
            dag. Trykk på en dag for å se hva som er lagt inn; bruk «Åpne i ukeplan» i vinduet eller lenken til ukeplan
            over om du vil redigere. «I dag» har hel ramme.
          </p>
        </div>
      </MatHandlelistePageShell>

      <MatHandlelisteAppendRangeDialog
        open={appendOpen}
        onClose={() => setAppendOpen(false)}
        fromKey={rangeFrom}
        toKey={rangeTo}
        lines={rangeLines}
      />

      <MatHandlelisteDayPlanModal
        open={selectedDateKey != null}
        onClose={() => setSelectedDateKey(null)}
        dateKey={selectedDateKey}
        planByDate={planByDate}
        visibleSlots={planVisibleSlots}
        mealTitlesById={mealTitlesById}
      />
    </>
  )
}
