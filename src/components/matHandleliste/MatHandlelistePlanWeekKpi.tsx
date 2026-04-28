'use client'

import StatCard from '@/components/ui/StatCard'
import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { WeekPlanSummary } from '@/features/matHandleliste/planHelpers'
import { MEAL_SLOT_ORDER, type MealSlotId } from '@/features/matHandleliste/types'
import { CalendarDays, LayoutGrid, UtensilsCrossed } from 'lucide-react'
import { useStore } from '@/lib/store'
import { chartColorsForUiPalette } from '@/lib/uiColorPalette'
const KPI_POSITIVE = '#0CA678'
const KPI_NEUTRAL = '#868E96'

function slotBreakdown(bySlot: Record<MealSlotId, number>): { slot: MealSlotId; n: number }[] {
  return MEAL_SLOT_ORDER.map((slot) => ({ slot, n: bySlot[slot] ?? 0 })).filter((x) => x.n > 0)
}

const kpiInfoBase =
  'Tallene gjelder valgt uke og bare tidsrom du har valgt under Planinnstillinger. Skjulte tidsrom med lagret plan teller ikke her.'

export function MatHandlelistePlanWeekKpi({
  stats,
  weekLabel,
  weekDayCount,
}: {
  stats: WeekPlanSummary
  weekLabel: string
  weekDayCount: number
}) {
  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const kpiPrimary = chartColorsForUiPalette(uiColorPalette).primary
  const pct = stats.totalSlots > 0 ? Math.round((stats.filledSlots / stats.totalSlots) * 100) : 0
  const breakdown = slotBreakdown(stats.bySlot)
  const daysFull = stats.daysWithPlan === weekDayCount && weekDayCount > 0

  return (
    <aside className="space-y-3" aria-label={`Ukeoversikt ${weekLabel}`}>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0"
        aria-live="polite"
        aria-atomic="true"
      >
        <StatCard
          label="Planlagte måltider"
          value={String(stats.plannedMealCount)}
          sub={weekLabel}
          icon={UtensilsCrossed}
          color={kpiPrimary}
          info={kpiInfoBase}
        />
        <StatCard
          label="Dager med plan"
          value={`${stats.daysWithPlan} av ${weekDayCount}`}
          sub={daysFull ? 'Hele uken har minst ett valgt tidsrom fylt' : 'Dager med minst ett planlagt måltid (valgte tidsrom)'}
          icon={CalendarDays}
          color={KPI_POSITIVE}
          trend={daysFull ? 'up' : undefined}
          info={kpiInfoBase}
        />
        <StatCard
          label="Tidsrom fylt"
          value={`${stats.filledSlots} av ${stats.totalSlots}`}
          sub={`${pct} % av mulige plasser (${stats.filledSlots}/${stats.totalSlots})`}
          icon={LayoutGrid}
          color={KPI_NEUTRAL}
          trend={pct >= 70 ? 'up' : undefined}
          info={`${kpiInfoBase} «Mulige plasser» = antall dager ganger antall tidsrom du planlegger for.`}
        />
      </div>
      {breakdown.length > 0 ? (
        <div
          className="rounded-2xl border p-3 text-xs sm:p-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Fordeling
          </p>
          <ul className="mt-2 space-y-1.5" style={{ color: 'var(--text)' }}>
            {breakdown.map(({ slot, n }) => (
              <li key={slot} className="flex justify-between gap-2 tabular-nums">
                <span>{MEAL_SLOT_LABELS[slot]}</span>
                <span style={{ color: 'var(--text-muted)' }}>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
