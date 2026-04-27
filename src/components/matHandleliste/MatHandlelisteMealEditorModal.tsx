'use client'

import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { IngredientUnit, Meal, MealIngredient, MealSlotId } from '@/features/matHandleliste/types'
import { MEAL_SLOT_ORDER } from '@/features/matHandleliste/types'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { useStore } from '@/lib/store'
import { generateId } from '@/lib/utils'
import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'stk', label: 'stk' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'dl', label: 'dl' },
  { value: 'l', label: 'l' },
  { value: 'ss', label: 'ss' },
  { value: 'ts', label: 'ts' },
  { value: 'pakke', label: 'pakke' },
  { value: 'neve', label: 'neve' },
  { value: 'other', label: 'Annet' },
]

function emptyIngredient(): MealIngredient {
  return { id: generateId(), name: '', quantity: null, unit: 'stk' }
}

export function MatHandlelisteMealEditorModal({
  editing,
  onClose,
  onCreated,
  initialTagsWhenCreating,
}: {
  editing: Meal | 'new' | null
  onClose: () => void
  /** Kalles etter vellykket opprettelse (kun når editing === 'new'). */
  onCreated?: (mealId: string) => void
  /** Forhåndsvalgte tidsrom når nye måltid åpnes (f.eks. fra ukeplan). */
  initialTagsWhenCreating?: MealSlotId[]
}) {
  const profiles = useStore((s) => s.profiles)
  const meals = useStore((s) => s.matHandleliste.meals)
  const shoppingList = useStore((s) => s.matHandleliste.list)
  const mhAddMeal = useStore((s) => s.mhAddMeal)
  const mhUpdateMeal = useStore((s) => s.mhUpdateMeal)
  const mhRemoveMeal = useStore((s) => s.mhRemoveMeal)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [defaultServings, setDefaultServings] = useState(4)
  const [mealTags, setMealTags] = useState<MealSlotId[]>([])
  const [ingredients, setIngredients] = useState<MealIngredient[]>([emptyIngredient()])

  const titleId = useId()
  const listSuffix = useId().replace(/:/g, '')
  const backdropDismiss = useModalBackdropDismiss(onClose)

  const profileLabel = (id: string) => profiles.find((p) => p.id === id)?.name ?? 'Ukjent profil'

  const ingredientNameSuggestions = useMemo(() => {
    const s = new Set<string>()
    for (const it of shoppingList) {
      const n = it.displayName.trim()
      if (n) s.add(n)
    }
    for (const m of meals) {
      for (const ing of m.ingredients) {
        const n = ing.name.trim()
        if (n) s.add(n)
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'nb'))
  }, [meals, shoppingList])

  const ingredientSectionSuggestions = useMemo(() => {
    const s = new Set<string>()
    for (const row of ingredients) {
      const sec = row.section?.trim()
      if (sec) s.add(sec)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'nb'))
  }, [ingredients])

  useEffect(() => {
    if (editing == null) return
    if (editing === 'new') {
      setTitle('')
      setDescription('')
      setDefaultServings(4)
      setMealTags(initialTagsWhenCreating?.length ? [...initialTagsWhenCreating] : [])
      setIngredients([emptyIngredient()])
      return
    }
    setTitle(editing.title)
    setDescription(editing.description ?? '')
    setDefaultServings(editing.defaultServings)
    setMealTags(editing.tags ? [...editing.tags] : [])
    setIngredients(editing.ingredients.length ? editing.ingredients.map((x) => ({ ...x })) : [emptyIngredient()])
  }, [editing, initialTagsWhenCreating])

  useEffect(() => {
    if (editing == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editing, onClose])

  function toggleTag(id: MealSlotId) {
    setMealTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function saveMeal() {
    const ingClean = ingredients
      .filter((i) => i.name.trim())
      .map((i) => {
        const sec = i.section?.trim()
        const next: MealIngredient = {
          ...i,
          name: i.name.trim(),
        }
        if (sec) next.section = sec.slice(0, 80)
        else delete next.section
        return next
      })
    const tagPayload = mealTags.length ? mealTags : undefined
    if (editing === 'new') {
      const r = mhAddMeal({
        title,
        description: description.trim() || undefined,
        defaultServings,
        ingredients: ingClean.map(({ id: _omit, ...rest }) => rest),
        tags: tagPayload,
      })
      if (r.ok) {
        onCreated?.(r.id)
        onClose()
      }
      return
    }
    if (editing) {
      mhUpdateMeal(editing.id, {
        title,
        description: description.trim() || null,
        defaultServings,
        ingredients: ingClean,
        tags: mealTags.length ? mealTags : null,
      })
      onClose()
    }
  }

  if (editing == null) return null

  const namesListId = `mh-ingredient-names-${listSuffix}`
  const sectionsListId = `mh-ingredient-sections-${listSuffix}`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      role="presentation"
      {...backdropDismiss}
    >
      <div
        className="relative z-[101] flex max-h-[min(92dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border shadow-xl sm:max-h-[88vh] sm:rounded-2xl pb-[max(0px,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-base font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              {editing === 'new' ? 'Nytt måltid' : 'Rediger måltid'}
            </h2>
            {editing !== 'new' ? (
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Lagt inn av {profileLabel(editing.createdByProfileId)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Tittel
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full min-h-[44px] rounded-xl border px-3 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <label className="mt-3 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Beskrivelse (valgfritt)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <label className="mt-3 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Standard porsjoner
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={defaultServings}
            onChange={(e) => setDefaultServings(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="mt-1 w-28 min-h-[44px] rounded-xl border px-3 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <fieldset className="mt-4">
            <legend className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Når passer måltidet? (valgfritt)
            </legend>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Velg én eller flere. Tomt = vises i alle tidsrom i ukeplanen.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MEAL_SLOT_ORDER.map((slot) => {
                const on = mealTags.includes(slot)
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleTag(slot)}
                    className="min-h-[40px] rounded-full border px-3 text-xs font-medium touch-manipulation"
                    style={{
                      borderColor: on ? 'var(--primary)' : 'var(--border)',
                      background: on ? 'var(--primary-pale)' : 'var(--bg)',
                      color: on ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    {MEAL_SLOT_LABELS[slot]}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Ingredienser
          </h3>
          <datalist id={namesListId}>
            {ingredientNameSuggestions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <datalist id={sectionsListId}>
            {ingredientSectionSuggestions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <ul className="mt-2 space-y-3">
            {ingredients.map((ing, idx) => (
              <li key={ing.id} className="rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => {
                      const next = [...ingredients]
                      next[idx] = { ...ing, name: e.target.value }
                      setIngredients(next)
                    }}
                    placeholder="Navn"
                    list={namesListId}
                    autoComplete="off"
                    className="min-w-[8rem] flex-1 min-h-[40px] rounded-lg border px-2 text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <input
                    value={ing.section ?? ''}
                    onChange={(e) => {
                      const next = [...ingredients]
                      next[idx] = { ...ing, section: e.target.value || undefined }
                      setIngredients(next)
                    }}
                    placeholder="Seksjon"
                    list={sectionsListId}
                    autoComplete="off"
                    className="min-w-[6rem] flex-1 min-h-[40px] rounded-lg border px-2 text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <input
                    type="number"
                    value={ing.quantity ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      const next = [...ingredients]
                      next[idx] = { ...ing, quantity: v === '' ? null : Number(v) }
                      setIngredients(next)
                    }}
                    placeholder="Mengde"
                    className="w-20 min-h-[40px] rounded-lg border px-2 text-sm tabular-nums"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => {
                      const next = [...ingredients]
                      next[idx] = { ...ing, unit: e.target.value as IngredientUnit }
                      setIngredients(next)
                    }}
                    className="min-h-[40px] rounded-lg border px-2 text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  {ing.unit === 'other' ? (
                    <input
                      value={ing.unitLabel ?? ''}
                      onChange={(e) => {
                        const next = [...ingredients]
                        next[idx] = { ...ing, unitLabel: e.target.value }
                        setIngredients(next)
                      }}
                      placeholder="Enhet"
                      className="min-h-[40px] flex-1 rounded-lg border px-2 text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  ) : null}
                  <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={!!ing.isStaple}
                      onChange={(e) => {
                        const next = [...ingredients]
                        next[idx] = { ...ing, isStaple: e.target.checked }
                        setIngredients(next)
                      }}
                    />
                    Stiftvare
                  </label>
                  <button
                    type="button"
                    onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    aria-label="Fjern linje"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setIngredients([...ingredients, emptyIngredient()])}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <Plus size={16} /> Legg til ingrediens
          </button>
          <div className="mt-6 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border px-4 text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={saveMeal}
              className="min-h-[44px] rounded-xl px-4 text-sm font-semibold text-white"
              style={{ background: 'var(--primary)' }}
            >
              Lagre
            </button>
            {editing !== 'new' && editing != null ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.confirm('Slette dette måltidet?')) {
                    mhRemoveMeal(editing.id)
                    onClose()
                  }
                }}
                className="min-h-[44px] rounded-xl border px-4 text-sm text-red-600"
                style={{ borderColor: 'var(--border)' }}
              >
                Slett
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
