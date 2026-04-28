'use client'

import { MatHandlelistePlanSlotFields } from '@/components/matHandleliste/MatHandlelistePlanSlotFields'
import { addDays, formatDateKeyNb } from '@/features/matHandleliste/planHelpers'
import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { DayPlan, Meal, MealSlotId, PlannedSlot } from '@/features/matHandleliste/types'

const weekdayShort = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

export function MatHandlelistePlanWeekGrid({
  weekStart,
  dayKeys,
  visibleSlots,
  planByDate,
  meals,
  mealMap,
  mhSetPlanSlot,
  onRequestCreateMeal,
}: {
  weekStart: Date
  dayKeys: string[]
  visibleSlots: MealSlotId[]
  planByDate: Record<string, DayPlan>
  meals: Meal[]
  mealMap: Map<string, Meal>
  mhSetPlanSlot: (dateKey: string, slot: MealSlotId, planned: PlannedSlot | null) => void
  onRequestCreateMeal?: (ctx: { dateKey: string; slot: MealSlotId }) => void
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border touch-manipulation lg:overflow-x-visible" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full min-w-0 table-fixed border-collapse text-sm" style={{ background: 'var(--surface)' }}>
        <colgroup>
          <col style={{ width: '7.5%' }} />
          {dayKeys.map((dk) => (
            <col key={dk} style={{ width: `${92.5 / 7}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 border-b p-2 text-left text-xs font-medium lg:static"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              Tidsrom
            </th>
            {dayKeys.map((dk, di) => {
              const d = addDays(weekStart, di)
              const wdIdx = (d.getDay() + 6) % 7
              const wd = weekdayShort[wdIdx] ?? ''
              return (
                <th
                  key={dk}
                  scope="col"
                  className="min-w-0 border-b p-2 text-center text-xs font-semibold capitalize"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <span className="block">{wd}</span>
                  <span className="tabular-nums font-normal" style={{ color: 'var(--text-muted)' }}>
                    {formatDateKeyNb(dk)}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {visibleSlots.map((slot, rowIdx) => {
            const rowBg = rowIdx % 2 === 1 ? 'var(--bg)' : 'var(--surface)'
            return (
              <tr key={slot} style={{ background: rowBg }}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 min-w-0 border-b p-2 text-left align-top lg:static"
                  style={{ borderColor: 'var(--border)', background: rowBg, color: 'var(--text)' }}
                >
                  <span className="text-xs font-semibold">{MEAL_SLOT_LABELS[slot]}</span>
                </th>
                {dayKeys.map((dk) => {
                  const plan: DayPlan = planByDate[dk] ?? { slots: {} }
                  const cur = plan.slots?.[slot]
                  return (
                    <td
                      key={`${dk}-${slot}`}
                      className="h-full min-h-0 min-w-0 border-b p-2 align-top"
                      style={{ borderColor: 'var(--border)', background: rowBg }}
                    >
                      <div className="flex h-full min-h-0 flex-col">
                        <MatHandlelistePlanSlotFields
                          dateKey={dk}
                          slot={slot}
                          cur={cur}
                          meals={meals}
                          mealMap={mealMap}
                          mhSetPlanSlot={mhSetPlanSlot}
                          fieldIdPrefix={`grid-${dk}-${slot}`}
                          density="compact"
                          onRequestCreateMeal={onRequestCreateMeal}
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
