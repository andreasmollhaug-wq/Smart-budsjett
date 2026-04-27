'use client'

import { formatDateKeyNb, mealVisibleInSlot } from '@/features/matHandleliste/planHelpers'
import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { Meal, MealSlotId, PlannedSlot } from '@/features/matHandleliste/types'

export function MatHandlelistePlanSlotFields({
  dateKey,
  slot,
  cur,
  meals,
  mealMap,
  mhSetPlanSlot,
  fieldIdPrefix,
  density = 'comfortable',
  onRequestCreateMeal,
}: {
  dateKey: string
  slot: MealSlotId
  cur: PlannedSlot | null | undefined
  meals: Meal[]
  mealMap: Map<string, Meal>
  mhSetPlanSlot: (dateKey: string, slot: MealSlotId, planned: PlannedSlot | null) => void
  fieldIdPrefix: string
  density?: 'compact' | 'comfortable'
  /** Åpner «nytt måltid» fra plan (med forvalg av tidsrom og valgfri plassering i cellen). */
  onRequestCreateMeal?: (ctx: { dateKey: string; slot: MealSlotId }) => void
}) {
  const selectId = `${fieldIdPrefix}-meal`
  const servingsId = `${fieldIdPrefix}-por`
  const slotLabel = MEAL_SLOT_LABELS[slot]
  const dateNb = formatDateKeyNb(dateKey)

  const isCompact = density === 'compact'
  const labelClass = isCompact
    ? 'text-xs font-medium leading-tight'
    : 'mt-2 block text-xs font-medium'
  const firstLabelClass = isCompact ? 'text-xs font-medium leading-tight' : 'mt-2 block text-xs font-medium'

  const selectClass = isCompact
    ? 'min-h-[44px] w-full min-w-0 rounded-xl border px-2 text-xs'
    : 'mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm'

  const servingsClass = isCompact
    ? 'min-h-[44px] w-full rounded-xl border px-2 text-xs tabular-nums'
    : 'mt-1 min-h-[44px] w-full max-w-[8rem] rounded-xl border px-3 text-sm tabular-nums'

  const fieldBg = isCompact ? 'var(--bg)' : 'var(--surface)'

  return (
    <div className={isCompact ? 'flex flex-col gap-1' : 'flex flex-col'}>
      <label
        className={firstLabelClass}
        style={{ color: 'var(--text-muted)' }}
        htmlFor={selectId}
      >
        Måltid
      </label>
      <select
        id={selectId}
        aria-label={`Måltid, ${slotLabel} ${dateNb}`}
        value={cur?.mealId ?? ''}
        onChange={(e) => {
          const v = e.target.value
          if (!v) mhSetPlanSlot(dateKey, slot, null)
          else mhSetPlanSlot(dateKey, slot, { mealId: v, servings: null })
        }}
        className={selectClass}
        style={{
          borderColor: 'var(--border)',
          background: fieldBg,
          color: 'var(--text)',
        }}
      >
        <option value="">—</option>
        {meals
          .filter((m) => mealVisibleInSlot(m, slot) || m.id === cur?.mealId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
      </select>
      {cur?.mealId ? (
        <>
          <label
            className={labelClass}
            style={{ color: 'var(--text-muted)' }}
            htmlFor={servingsId}
          >
            Antall porsjoner
          </label>
          <input
            id={servingsId}
            aria-label={`Antall porsjoner, ${slotLabel} ${dateNb}`}
            type="number"
            min={1}
            max={50}
            value={cur.servings ?? mealMap.get(cur.mealId)?.defaultServings ?? 4}
            onChange={(e) => {
              const n = Math.max(1, Math.min(50, Number(e.target.value) || 1))
              mhSetPlanSlot(dateKey, slot, { mealId: cur.mealId, servings: n })
            }}
            className={servingsClass}
            style={{
              borderColor: 'var(--border)',
              background: fieldBg,
              color: 'var(--text)',
            }}
          />
        </>
      ) : null}
      {onRequestCreateMeal ? (
        <button
          type="button"
          className={
            isCompact
              ? 'mt-1 w-full min-h-[40px] rounded-lg border px-2 text-center text-[11px] font-medium leading-tight touch-manipulation'
              : 'mt-2 w-full min-h-[44px] rounded-xl border px-3 text-center text-xs font-medium touch-manipulation'
          }
          style={{ borderColor: 'var(--border)', color: 'var(--primary)', background: 'var(--bg)' }}
          onClick={() => onRequestCreateMeal({ dateKey, slot })}
        >
          + Nytt måltid
        </button>
      ) : null}
    </div>
  )
}
