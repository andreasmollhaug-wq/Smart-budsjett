'use client'

import { useState } from 'react'
import { Bookmark, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import type { SavedShoppingList } from '@/features/matHandleliste/types'
import { MAX_SAVED_SHOPPING_LISTS } from '@/features/matHandleliste/savedShoppingLists'
import { useStore } from '@/lib/store'

function alertPresetSave(
  result:
    | { ok: true }
    | { ok: false; reason: 'empty' | 'no_items' | 'limit' },
) {
  if (result.ok) return
  if (result.reason === 'empty') {
    window.alert('Skriv inn et navn først.')
    return
  }
  if (result.reason === 'no_items') {
    window.alert('Listen har ingen varer å lagre.')
    return
  }
  window.alert(`Du kan maks lagre ${MAX_SAVED_SHOPPING_LISTS} lagrede lister. Slett én først.`)
}

export function MatHandlelisteSavedShoppingListsCard() {
  const presets = useStore((s) => s.matHandleliste.savedShoppingLists)
  const mhSaveShoppingListPreset = useStore((s) => s.mhSaveShoppingListPreset)
  const mhRemoveSavedShoppingList = useStore((s) => s.mhRemoveSavedShoppingList)
  const mhRenameSavedShoppingList = useStore((s) => s.mhRenameSavedShoppingList)
  const mhApplySavedShoppingList = useStore((s) => s.mhApplySavedShoppingList)

  const [open, setOpen] = useState(true)
  const [draftName, setDraftName] = useState('')

  function saveCurrentAsPreset() {
    const r = mhSaveShoppingListPreset(draftName)
    alertPresetSave(r)
    if (r.ok) setDraftName('')
  }

  function renamePreset(p: SavedShoppingList) {
    const suggested = typeof window !== 'undefined' ? window.prompt('Nytt navn', p.name) : null
    if (suggested == null || !String(suggested).trim()) return
    mhRenameSavedShoppingList(p.id, suggested)
  }

  function mergePreset(p: SavedShoppingList) {
    mhApplySavedShoppingList(p.id, 'merge')
  }

  function replacePreset(p: SavedShoppingList) {
    if (typeof window === 'undefined') return
    if (
      !window.confirm(
        `Erstatte hele nåværende liste med innhold fra «${p.name}»? Dagens liste kan ikke hentes tilbake herfra.`,
      )
    ) {
      return
    }
    mhApplySavedShoppingList(p.id, 'replace')
  }

  function removePreset(p: SavedShoppingList) {
    if (typeof window === 'undefined') return
    if (!window.confirm(`Slette «${p.name}»?`)) return
    mhRemoveSavedShoppingList(p.id)
  }

  return (
    <div className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold touch-manipulation"
        style={{ color: 'var(--text)' }}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Bookmark size={18} className="shrink-0" aria-hidden />
          <span className="min-w-0 truncate">Lagrede lister</span>
        </span>
        {open ? <ChevronUp size={18} className="shrink-0" /> : <ChevronDown size={18} className="shrink-0" />}
      </button>
      {open ? (
        <div className="space-y-3 border-t px-3 py-3 text-sm" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Lagre innholdet på listen nå som en forhåndsdefinert mal (f.eks. ukeshandel). Du kan laste den inn senere uten
            å gjenbruke en gammel aktiv liste.
          </p>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Navn, f.eks. Fast ukeshandel"
              maxLength={60}
              className="min-h-[44px] min-w-0 flex-1 rounded-lg border px-3 text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              aria-label="Navn på lagret liste"
            />
            <button
              type="button"
              onClick={saveCurrentAsPreset}
              className="min-h-[44px] shrink-0 rounded-lg border px-3 text-sm font-medium touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Lagre nåværende
            </button>
          </div>
          {presets.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ingen lagrede lister ennå.
            </p>
          ) : (
            <ul className="space-y-3">
              {presets.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border p-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                >
                  <div className="mb-2 flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                    <span className="min-w-0 font-medium" style={{ color: 'var(--text)' }}>
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.lines.length} {p.lines.length === 1 ? 'vare' : 'varer'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => mergePreset(p)}
                      className="min-h-[44px] rounded-lg border px-3 text-xs font-medium touch-manipulation sm:text-sm"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Slå sammen
                    </button>
                    <button
                      type="button"
                      onClick={() => replacePreset(p)}
                      className="min-h-[44px] rounded-lg border px-3 text-xs font-medium touch-manipulation sm:text-sm"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      Erstatt liste
                    </button>
                    <button
                      type="button"
                      onClick={() => renamePreset(p)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border touch-manipulation"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      title="Gi nytt navn"
                      aria-label={`Gi nytt navn til ${p.name}`}
                    >
                      <Pencil size={18} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePreset(p)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border touch-manipulation"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      title="Slett"
                      aria-label={`Slett ${p.name}`}
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
