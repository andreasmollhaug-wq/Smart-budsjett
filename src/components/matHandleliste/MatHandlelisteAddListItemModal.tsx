'use client'

import { filterClassicGroceries } from '@/features/matHandleliste/classicGroceries'
import { categoryLabel } from '@/features/matHandleliste/categoryMap'
import {
  SHOPPING_LIST_UNIT_OPTIONS,
  clampShoppingListQuantity,
} from '@/features/matHandleliste/ingredientUnitOptions'
import type { IngredientUnit } from '@/features/matHandleliste/types'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { useStore } from '@/lib/store'
import { useEffect, useId, useMemo, useState } from 'react'
import { X } from 'lucide-react'

export function MatHandlelisteAddListItemModal({
  open,
  onClose,
  categoryOrder,
}: {
  open: boolean
  onClose: () => void
  categoryOrder: string[]
}) {
  const mhAddManualListItem = useStore((s) => s.mhAddManualListItem)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('annet')
  const [note, setNote] = useState('')
  const [priceStr, setPriceStr] = useState('')
  const [quantityStr, setQuantityStr] = useState('1')
  const [unit, setUnit] = useState<IngredientUnit>('stk')
  const [unitLabel, setUnitLabel] = useState('')
  const titleId = useId()
  const nameId = useId()
  const qtyId = useId()
  const unitId = useId()
  const unitLabelId = useId()
  const priceId = useId()
  const catId = useId()
  const noteId = useId()
  const backdropDismiss = useModalBackdropDismiss(onClose)

  const suggestions = useMemo(() => filterClassicGroceries(search, 50), [search])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setSearch('')
      setName('')
      setCategoryId('annet')
      setNote('')
      setPriceStr('')
      setQuantityStr('1')
      setUnit('stk')
      setUnitLabel('')
    }
  }, [open])

  function pickClassic(e: { displayName: string; categoryId: string; unitPriceNok: number }) {
    setName(e.displayName)
    setCategoryId(e.categoryId)
    setPriceStr(String(e.unitPriceNok))
    setSearch(e.displayName)
  }

  function submit() {
    const n = name.trim()
    if (!n) return
    const qTrim = quantityStr.trim()
    let quantity: number
    if (qTrim === '') {
      quantity = 1
    } else {
      const qNum = Number(qTrim.replace(/\s/g, '').replace(',', '.'))
      if (!Number.isFinite(qNum) || qNum <= 0) return
      quantity = clampShoppingListQuantity(qNum)
    }
    const pTrim = priceStr.trim()
    let unitPriceNok: number | null | undefined
    if (pTrim === '') {
      unitPriceNok = undefined
    } else {
      const num = Number(pTrim.replace(/\s/g, '').replace(',', '.'))
      if (!Number.isFinite(num)) return
      unitPriceNok = Math.max(0, Math.min(50_000, Math.round(num)))
    }
    mhAddManualListItem({
      name: n,
      categoryId,
      note: note.trim() || undefined,
      unitPriceNok,
      quantity,
      unit,
      unitLabel: unit === 'other' ? unitLabel.trim() || null : null,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      {...backdropDismiss}
    >
      <div
        className="max-h-[90vh] w-full max-w-md min-w-0 overflow-x-hidden overflow-y-auto rounded-t-2xl p-6 shadow-xl sm:rounded-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <h2 id={titleId} className="min-w-0 pr-2 text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Legg til vare
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Søk i katalogen (viser kategori) eller skriv fritt. Velg mengde og enhet (f.eks. 400 g eller 2 stk). Tomt
          prisfelt = bruk katalogpris hvis varen finnes der, ellers ingen pris.
        </p>

        <label className="mt-3 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Søk i katalog
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm touch-manipulation"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          placeholder="F.eks. melk, potet…"
          autoFocus
        />

        {suggestions.length > 0 ? (
          <ul
            className="mt-2 max-h-48 overflow-y-auto rounded-xl border"
            style={{ borderColor: 'var(--border)' }}
          >
            {suggestions.map((e, idx) => (
              <li key={`${e.displayName}-${e.categoryId}-${idx}`}>
                <button
                  type="button"
                  className="min-h-[48px] w-full px-3 py-2 text-left text-sm touch-manipulation hover:opacity-90"
                  style={{ background: 'transparent', color: 'var(--text)' }}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => pickClassic(e)}
                >
                  <span className="font-medium">{e.displayName}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>
                    {categoryLabel(e.categoryId)} · ca. {e.unitPriceNok} kr
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={nameId}>
              Varenavn
            </label>
            <input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={qtyId}>
                Mengde
              </label>
              <input
                id={qtyId}
                inputMode="decimal"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="F.eks. 400 eller 2,5"
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={unitId}>
                Enhet
              </label>
              <select
                id={unitId}
                value={unit}
                onChange={(e) => setUnit(e.target.value as IngredientUnit)}
                className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {SHOPPING_LIST_UNIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {unit === 'other' ? (
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={unitLabelId}>
                Enhetsnavn
              </label>
              <input
                id={unitLabelId}
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="F.eks. boks, liter kartong"
              />
            </div>
          ) : null}
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={catId}>
              Kategori
            </label>
            <select
              id={catId}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            >
              {categoryOrder.map((cid) => (
                <option key={cid} value={cid}>
                  {categoryLabel(cid)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={priceId}>
              Pris per enhet (NOK), valgfritt
            </label>
            <input
              id={priceId}
              inputMode="numeric"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm tabular-nums"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="Tomt = katalog eller ingen pris"
            />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }} htmlFor={noteId}>
              Notat
            </label>
            <input
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-xl border px-4 text-sm font-medium touch-manipulation sm:min-w-[7rem]"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={submit}
            className="min-h-[48px] rounded-xl px-4 text-sm font-semibold text-white touch-manipulation sm:min-w-[7rem]"
            style={{ background: 'var(--primary)' }}
          >
            Legg til
          </button>
        </div>
      </div>
    </div>
  )
}
