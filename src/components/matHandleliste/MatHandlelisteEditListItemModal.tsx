'use client'

import { categoryLabel } from '@/features/matHandleliste/categoryMap'
import {
  SHOPPING_LIST_UNIT_OPTIONS,
  clampShoppingListQuantity,
} from '@/features/matHandleliste/ingredientUnitOptions'
import type { IngredientUnit, ShoppingListItem } from '@/features/matHandleliste/types'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { useStore } from '@/lib/store'
import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'

export function MatHandlelisteEditListItemModal({
  open,
  item,
  onClose,
  categoryOrder,
}: {
  open: boolean
  item: ShoppingListItem | null
  onClose: () => void
  categoryOrder: string[]
}) {
  const mhPatchListItem = useStore((s) => s.mhPatchListItem)
  const [categoryId, setCategoryId] = useState('annet')
  const [note, setNote] = useState('')
  const [priceStr, setPriceStr] = useState('')
  const [quantityStr, setQuantityStr] = useState('')
  const [unit, setUnit] = useState<IngredientUnit>('stk')
  const [unitLabel, setUnitLabel] = useState('')
  const titleId = useId()
  const backdropDismiss = useModalBackdropDismiss(onClose)

  useEffect(() => {
    if (!item) return
    setCategoryId(item.categoryId)
    setNote(item.note ?? '')
    setPriceStr(item.unitPriceNok != null ? String(item.unitPriceNok) : '')
  }, [item])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function save() {
    if (!item) return
    const qTrim = quantityStr.trim()
    let quantity: number | null
    if (qTrim === '') {
      quantity = null
    } else {
      const qNum = Number(qTrim.replace(/\s/g, '').replace(',', '.'))
      if (!Number.isFinite(qNum) || qNum <= 0) return
      quantity = clampShoppingListQuantity(qNum)
    }
    const pTrim = priceStr.trim()
    let unitPriceNok: number | null
    if (pTrim === '') unitPriceNok = null
    else {
      const num = Number(pTrim.replace(/\s/g, '').replace(',', '.'))
      if (!Number.isFinite(num)) return
      unitPriceNok = Math.max(0, Math.min(50_000, Math.round(num)))
    }
    mhPatchListItem(item.id, {
      categoryId,
      note: note.trim() || null,
      unitPriceNok,
      quantity,
      unit,
      unitLabel: unit === 'other' ? unitLabel.trim() || null : null,
    })
    onClose()
  }

  if (!open || !item) return null

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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Rediger vare
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {item.displayName}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {item.manual ? 'Manuelt lagt inn' : 'Fra måltidsplan'}
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Mengde
              </label>
              <input
                inputMode="decimal"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="Tomt = ikke vist"
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Enhet
              </label>
              <select
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
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Enhetsnavn
              </label>
              <input
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
          ) : null}
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Kategori
            </label>
            <select
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
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Pris per enhet (NOK)
            </label>
            <input
              inputMode="numeric"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border px-3 text-sm tabular-nums"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="Tomt = ingen pris"
            />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Notat
            </label>
            <input
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
            className="min-h-[48px] rounded-xl border px-4 text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={save}
            className="min-h-[48px] rounded-xl px-4 text-sm font-semibold text-white touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Lagre
          </button>
        </div>
      </div>
    </div>
  )
}
