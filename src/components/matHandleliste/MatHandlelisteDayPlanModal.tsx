'use client'

import Link from 'next/link'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { formatDateKeyNb } from '@/features/matHandleliste/planHelpers'
import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { DayPlan, MealSlotId } from '@/features/matHandleliste/types'
import { X } from 'lucide-react'
import { useEffect, useId, useMemo } from 'react'

function formatDayHeadingLongNb(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!m) return dateKey
  const d = new Date(Number.parseInt(m[1]!, 10), Number.parseInt(m[2]!, 10) - 1, Number.parseInt(m[3]!, 10))
  if (!Number.isFinite(d.getTime())) return formatDateKeyNb(dateKey)
  const day = d.toLocaleDateString('nb-NO', { weekday: 'long' })
  const rest = d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${rest}`
}

export function MatHandlelisteDayPlanModal({
  open,
  onClose,
  dateKey,
  planByDate,
  visibleSlots,
  mealTitlesById,
}: {
  open: boolean
  onClose: () => void
  dateKey: string | null
  planByDate: Record<string, DayPlan>
  visibleSlots: MealSlotId[]
  mealTitlesById: Map<string, string>
}) {
  const titleId = useId()
  const backdropDismiss = useModalBackdropDismiss(onClose)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const rows = useMemo(() => {
    if (!dateKey) return []
    const day: DayPlan = planByDate[dateKey] ?? { slots: {} }
    return visibleSlots.map((slot) => {
      const planned = day.slots?.[slot]
      const mealTitle = planned ? mealTitlesById.get(planned.mealId) ?? 'Ukjent måltid' : null
      const servingsNote =
        planned?.servings != null && Number.isFinite(planned.servings)
          ? `${planned.servings} porsj.`
          : null
      return { slot, planned, mealTitle, servingsNote }
    })
  }, [dateKey, planByDate, visibleSlots, mealTitlesById])

  const hasAnyMeal = rows.some((r) => r.planned != null)

  if (!open || !dateKey) return null

  const weekPlanHref = `/intern/mat-handleliste/plan?uke=${dateKey}`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      {...backdropDismiss}
    >
      <div
        className="max-h-[85dvh] w-full max-w-md min-w-0 overflow-x-hidden overflow-y-auto rounded-t-2xl p-5 shadow-xl sm:rounded-2xl sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Dagens plan
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold leading-snug sm:text-xl" style={{ color: 'var(--text)' }}>
              {formatDayHeadingLongNb(dateKey)}
            </h2>
            <p className="mt-0.5 text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {formatDateKeyNb(dateKey)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        <div className="space-y-2">
          {hasAnyMeal ? (
            rows.map(({ slot, planned, mealTitle, servingsNote }) => (
              <div
                key={slot}
                className="rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: 'var(--border)',
                  background: planned ? 'var(--bg)' : 'color-mix(in srgb, var(--primary-pale) 35%, var(--surface))',
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {MEAL_SLOT_LABELS[slot]}
                </p>
                {planned ? (
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {mealTitle}
                    </p>
                    {servingsNote ? (
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {servingsNote}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ingen måltid
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="rounded-xl border px-3 py-4 text-sm leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Ingen måltider er planlagt denne dagen. Legg inn måltider i ukeplanen, eller åpne ukevisning under.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link
            href={weekPlanHref}
            onClick={onClose}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border px-4 text-center text-sm font-semibold touch-manipulation sm:min-w-[10rem] sm:flex-none"
            style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
          >
            Åpne i ukeplan
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white touch-manipulation sm:min-w-[8rem] sm:flex-none"
            style={{ background: 'var(--primary)' }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
