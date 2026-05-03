'use client'

import { useMemo, useState, useTransition } from 'react'
import type { RoutineCategoryId } from './routinePresetTypes'
import { addHabitsFromPresetIds } from './actions'
import {
  ROUTINE_PRESET_BATCH_MAX,
  getCategoryList,
  searchPresets,
} from './routinePresets'

type Props = {
  profileId: string
  monthPlanId: string
  open: boolean
  onOpenChange: (next: boolean) => void
  onDone: () => void
}

export function SmartvaneRoutinePicker({ profileId, monthPlanId, open, onOpenChange, onDone }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<RoutineCategoryId | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const categories = useMemo(() => getCategoryList(), [])
  const filtered = useMemo(() => searchPresets(query, category), [query, category])

  if (!open) return null

  const togglePreset = (id: string) => {
    setMessage(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < ROUTINE_PRESET_BATCH_MAX) next.add(id)
      return next
    })
  }

  const submit = () => {
    setMessage(null)
    if (selected.size === 0) {
      setMessage('Velg minst én rutine.')
      return
    }
    startTransition(async () => {
      const r = await addHabitsFromPresetIds({
        profileId,
        monthPlanId,
        presetIds: [...selected],
      })
      if (!r.ok) {
        setMessage(r.error)
        return
      }
      let msg =
        r.added === 1 ? 'La til én rutine.' : r.added === 0 ? 'Ingenting lagt til.' : `La til ${r.added} rutiner.`
      if (r.skipped.length > 0) {
        msg += ` Noen ble ikke lagt til (${r.skipped.length}): ${r.skipped.slice(0, 2).map((s) => s.reason).join('; ')}.`
      }
      setMessage(msg)
      setSelected(new Set())
      setQuery('')
      setCategory(null)
      onDone()
      if (r.added > 0) {
        setTimeout(() => onOpenChange(false), 450)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4" role="presentation">
      <button
        type="button"
        aria-label="Lukk"
        className="absolute inset-0 bg-black/40 touch-manipulation"
        onPointerDown={(e) => {
          if (pending) return
          e.preventDefault()
          onOpenChange(false)
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sv-routine-picker-title"
        className="relative z-[101] flex max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border shadow-xl sm:max-h-[85vh] sm:rounded-2xl min-h-0 min-w-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <header
          className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <h2 id="sv-routine-picker-title" className="text-base font-semibold m-0 truncate" style={{ color: 'var(--text)' }}>
              Rutinebibliotek
            </h2>
            <p className="text-xs m-0 truncate" style={{ color: 'var(--text-muted)' }}>
              Velg opptil {ROUTINE_PRESET_BATCH_MAX}. Søk og filtrer etter type.
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-xl border text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            onClick={() => !pending && onOpenChange(false)}
          >
            ✕
          </button>
        </header>

        <div className="shrink-0 space-y-2 border-b px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk, f.eks. trening, bad, budsjett"
            className="w-full min-h-[44px] rounded-xl border px-3 text-sm min-w-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            autoComplete="off"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 min-w-0 touch-pan-x" role="tablist" aria-label="Kategorier">
            <button
              type="button"
              role="tab"
              aria-selected={category === null}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap touch-manipulation"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border)',
                background: category === null ? 'var(--primary-pale)' : 'var(--surface)',
                color: category === null ? 'var(--primary)' : 'var(--text)',
              }}
              onClick={() => setCategory(null)}
            >
              Alle
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap touch-manipulation"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--border)',
                  background: category === c.id ? 'var(--primary-pale)' : 'var(--surface)',
                  color: category === c.id ? 'var(--primary)' : 'var(--text)',
                }}
                onClick={() => setCategory(c.id)}
              >
                {c.titleNo}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <p className="text-sm px-3 py-4 m-0" style={{ color: 'var(--text-muted)' }}>
              Ingen treff — prøv et annet søk eller kategori.
            </p>
          ) : (
            <ul className="m-0 list-none flex flex-col gap-2 p-0">
              {filtered.map((p) => {
                const on = selected.has(p.id)
                const kindLabel =
                  p.kind === 'daily' ? 'Daglig' : p.kind === 'weekly' ? 'Ukentlig' : 'Månedlig'
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => togglePreset(p.id)}
                      aria-pressed={on}
                      className="flex w-full min-h-[52px] min-w-0 items-start gap-3 rounded-xl border px-3 py-2 text-left touch-manipulation text-sm"
                      style={{
                        borderColor: on ? 'var(--primary)' : 'var(--border)',
                        background: on ? 'var(--primary-pale)' : 'var(--bg)',
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-bold text-xs"
                        style={{
                          borderColor: 'var(--border)',
                          background: on ? 'var(--primary)' : 'transparent',
                          color: on ? '#fff' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {on ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold block" style={{ color: 'var(--text)' }}>
                          {p.name}
                        </span>
                        <span className="text-xs block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {kindLabel}
                          {p.note ? ` · ${p.note}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer
          className="shrink-0 border-t px-4 py-3 flex flex-wrap items-center justify-between gap-2 safe-area-bottom"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {selected.size} av {ROUTINE_PRESET_BATCH_MAX} valgt
          </span>
          <div className="flex gap-2 min-w-0">
            <button
              type="button"
              disabled={pending}
              className="min-h-[44px] rounded-xl border px-3 text-sm font-medium touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              onClick={() => !pending && onOpenChange(false)}
            >
              Avbryt
            </button>
            <button
              type="button"
              disabled={pending || selected.size === 0}
              className="min-h-[44px] min-w-[140px] rounded-xl text-sm font-medium text-white touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--cta-gradient)', backgroundClip: 'padding-box' }}
              onClick={submit}
            >
              {pending ? 'Lagrer …' : 'Legg til valgte'}
            </button>
          </div>
          {message ? (
            <p className="basis-full text-sm m-0" role="status" style={{ color: 'var(--text-muted)' }}>
              {message}
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  )
}
