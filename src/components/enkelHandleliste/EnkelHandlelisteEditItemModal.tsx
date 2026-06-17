'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { EhItem } from '@/features/enkelHandleliste/types'
import { EhSheet } from '@/features/enkelHandleliste/components/EhSheet'
import {
  ehPrimaryBtnClass,
  ehPrimaryBtnStyle,
  ehSecondaryBtnClass,
  ehSecondaryBtnStyle,
} from '@/features/enkelHandleliste/ehUi'

export function EnkelHandlelisteEditItemModal({
  open,
  item,
  showQuantity,
  onClose,
  onSave,
}: {
  open: boolean
  item: EhItem | null
  showQuantity: boolean
  onClose: () => void
  onSave: (patch: { name: string; quantity: number | null }) => void
}) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState<number | null>(null)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setQty(item.quantity ?? null)
    }
  }, [item])

  const save = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), quantity: qty })
    onClose()
  }

  const step = (delta: number) => {
    setQty((q) => {
      const next = (q ?? 0) + delta
      return next <= 0 ? null : Math.min(99, next)
    })
  }

  return (
    <EhSheet
      open={open}
      onClose={onClose}
      title="Rediger vare"
      footer={
        <div className="flex gap-2.5">
          <button type="button" className={`flex-1 ${ehSecondaryBtnClass}`} style={ehSecondaryBtnStyle} onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className={`flex-1 ${ehPrimaryBtnClass}`}
            style={ehPrimaryBtnStyle}
            disabled={!name.trim()}
            onClick={save}
          >
            Lagre
          </button>
        </div>
      }
    >
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Navn
      </label>
      <input
        className="mb-4 min-h-[52px] w-full rounded-2xl border px-4 text-base outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
      />
      {showQuantity && (
        <>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Antall
          </label>
          <div className="mb-2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Færre"
              className="inline-flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl border active:scale-95"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
              onClick={() => step(-1)}
            >
              <Minus size={18} aria-hidden />
            </button>
            <span className="min-w-[3ch] text-center text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {qty ?? '—'}
            </span>
            <button
              type="button"
              aria-label="Flere"
              className="inline-flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl border active:scale-95"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
              onClick={() => step(1)}
            >
              <Plus size={18} aria-hidden />
            </button>
          </div>
        </>
      )}
    </EhSheet>
  )
}
