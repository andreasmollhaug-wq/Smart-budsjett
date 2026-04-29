'use client'

import { normalizeIngredientKey } from '@/features/matHandleliste/ingredientKey'
import { formatDateKeyNb } from '@/features/matHandleliste/planHelpers'
import { mealIngredientToLines, portionFactorForMeal } from '@/features/matHandleliste/mergeIngredients'
import type { Meal } from '@/features/matHandleliste/types'
import { useStore } from '@/lib/store'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  meal: Meal | null
  title: string
}

export function MatHandlelisteAppendMealDialog({ open, onClose, meal, title }: Props) {
  const staples = useStore((s) => s.matHandleliste.staples)
  const mhAppendMealToList = useStore((s) => s.mhAppendMealToList)

  const [servings, setServings] = useState(4)
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open || !meal) return
    setServings(meal.defaultServings)
    const auto = new Set<string>()
    for (const ing of meal.ingredients) {
      if (ing.isStaple || staples.includes(normalizeIngredientKey(ing.name))) auto.add(ing.id)
    }
    setExcludeIds(auto)
  }, [open, meal, staples])

  const preview = useMemo(() => {
    if (!meal) return []
    const factor = portionFactorForMeal(meal.defaultServings, servings)
    return meal.ingredients.map((ing) => ({
      ing,
      line: mealIngredientToLines([ing], factor, { mealId: meal.id, mealTitle: meal.title })[0]!,
    }))
  }, [meal, servings])

  if (!open || !meal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="mh-append-title">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative z-[101] max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border p-4 shadow-lg sm:rounded-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 id="mh-append-title" className="text-base font-bold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          Velg porsjoner og kryss av det du allerede har hjemme.
        </p>
        <label className="mt-3 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Porsjoner
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={servings}
          onChange={(e) => setServings(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          className="mt-1 w-28 min-h-[44px] rounded-xl border px-3 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <ul className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto">
          {preview.map(({ ing, line }) => {
            const isStaple = ing.isStaple || staples.includes(normalizeIngredientKey(ing.name))
            const excluded = excludeIds.has(ing.id)
            return (
              <li key={ing.id} className="flex gap-2 rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                <input
                  type="checkbox"
                  checked={excluded}
                  onChange={() => {
                    const next = new Set(excludeIds)
                    if (excluded) next.delete(ing.id)
                    else next.add(ing.id)
                    setExcludeIds(next)
                  }}
                  className="mt-1 h-5 w-5 shrink-0"
                  aria-label={`Ekskluder ${ing.name}`}
                />
                <div className="min-w-0 flex-1">
                  <span style={{ color: 'var(--text)' }}>{line.displayName}</span>
                  {line.quantity != null ? (
                    <span className="ml-2 tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
                      {line.quantity} {line.unit === 'other' ? line.unitLabel : line.unit}
                    </span>
                  ) : null}
                  {isStaple ? (
                    <span className="ml-2 text-xs" style={{ color: 'var(--primary)' }}>
                      har ofte hjemme
                    </span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
            onClick={() => {
              const ex = [...excludeIds]
              mhAppendMealToList({ mealId: meal.id, effectiveServings: servings, excludeIngredientIds: ex })
              setExcludeIds(new Set())
              onClose()
            }}
          >
            Legg på listen
          </button>
        </div>
      </div>
    </div>
  )
}

export function MatHandlelisteAppendRangeDialog({
  open,
  onClose,
  fromKey,
  toKey,
  lines,
}: {
  open: boolean
  onClose: () => void
  fromKey: string
  toKey: string
  lines: { normalizedKey: string; displayName: string }[]
}) {
  const mhAppendDateRangeToList = useStore((s) => s.mhAppendDateRangeToList)
  const [excludeKeys, setExcludeKeys] = useState<Set<string>>(new Set())

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative z-[101] max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border p-4 shadow-lg sm:rounded-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          Legg plan på handleliste
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatDateKeyNb(fromKey)} – {formatDateKeyNb(toKey)}. Kryss av det du ikke trenger å kjøpe.
        </p>
        <ul className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto">
          {lines.map((l) => {
            const ex = excludeKeys.has(l.normalizedKey)
            return (
              <li key={l.normalizedKey} className="flex gap-2 rounded-lg border p-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                <input
                  type="checkbox"
                  checked={ex}
                  onChange={() => {
                    const next = new Set(excludeKeys)
                    if (ex) next.delete(l.normalizedKey)
                    else next.add(l.normalizedKey)
                    setExcludeKeys(next)
                  }}
                  className="mt-1 h-5 w-5"
                />
                <span style={{ color: 'var(--text)' }}>{l.displayName}</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
            onClick={() => {
              mhAppendDateRangeToList({
                fromKey,
                toKey,
                excludeNormalizedKeys: [...excludeKeys],
              })
              setExcludeKeys(new Set())
              onClose()
            }}
          >
            Legg til
          </button>
        </div>
      </div>
    </div>
  )
}
