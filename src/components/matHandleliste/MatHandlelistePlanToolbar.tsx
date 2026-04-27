'use client'

import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { PlanWeekLayout } from '@/features/matHandleliste/types'
import { MEAL_SLOT_ORDER, type MealSlotId } from '@/features/matHandleliste/types'

export function MatHandlelistePlanToolbar({
  visibleSlots,
  onVisibleSlotsChange,
  layout,
  onLayoutChange,
  variant = 'card',
}: {
  visibleSlots: MealSlotId[]
  onVisibleSlotsChange: (slots: MealSlotId[]) => void
  layout: PlanWeekLayout
  onLayoutChange: (mode: PlanWeekLayout) => void
  /** `plain` = ingen ytre ramme (f.eks. inne i sammenleggbart panel). */
  variant?: 'card' | 'plain'
}) {
  const set = new Set(visibleSlots)

  function toggleSlot(slot: MealSlotId) {
    const next = new Set(set)
    if (next.has(slot)) {
      if (next.size <= 1) return
      next.delete(slot)
    } else {
      next.add(slot)
    }
    onVisibleSlotsChange(MEAL_SLOT_ORDER.filter((s) => next.has(s)))
  }

  if (variant === 'plain') {
    return (
      <div className="space-y-3">
        <ToolbarInner
          set={set}
          layout={layout}
          toggleSlot={toggleSlot}
          onLayoutChange={onLayoutChange}
        />
      </div>
    )
  }

  return (
    <div
      className="space-y-3 rounded-xl border p-3"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <ToolbarInner
        set={set}
        layout={layout}
        toggleSlot={toggleSlot}
        onLayoutChange={onLayoutChange}
      />
    </div>
  )
}

function ToolbarInner({
  set,
  layout,
  toggleSlot,
  onLayoutChange,
}: {
  set: Set<MealSlotId>
  layout: PlanWeekLayout
  toggleSlot: (slot: MealSlotId) => void
  onLayoutChange: (mode: PlanWeekLayout) => void
}) {
  return (
    <>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Hva som vises i planen
        </p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Velg tidsrom (f.eks. kun middag). Skjulte rader fjerner ikke lagret plan. Minst ett tidsrom må være på.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MEAL_SLOT_ORDER.map((slot) => {
            const on = set.has(slot)
            return (
              <button
                key={slot}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggleSlot(slot)}
                className="min-h-[44px] rounded-xl border px-3 text-sm font-medium transition-colors touch-manipulation"
                style={{
                  borderColor: 'var(--border)',
                  background: on ? 'var(--primary-pale)' : 'var(--bg)',
                  color: on ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {MEAL_SLOT_LABELS[slot]}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Ukesvisning
        </p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Automatisk: rutenett på stor skjerm, liste på mobil. Handleliste fra plan bruker kun valgte tidsrom.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              { mode: 'auto' as const, label: 'Automatisk' },
              { mode: 'grid' as const, label: 'Alltid rutenett' },
              { mode: 'list' as const, label: 'Alltid liste' },
            ] as const
          ).map(({ mode, label }) => {
            const active = layout === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onLayoutChange(mode)}
                className="min-h-[44px] rounded-xl border px-3 text-sm font-medium transition-colors touch-manipulation"
                style={{
                  borderColor: active ? 'var(--primary)' : 'var(--border)',
                  background: active ? 'var(--primary-pale)' : 'var(--bg)',
                  color: active ? 'var(--primary)' : 'var(--text)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
