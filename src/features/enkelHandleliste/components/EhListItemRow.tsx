'use client'

import { Check, Pencil, Trash2 } from 'lucide-react'
import type { EhItem } from '../types'

export function EhListItemRow({
  item,
  canEdit,
  canDelete,
  showQuantity,
  contributorInitial,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: EhItem
  canEdit: boolean
  canDelete: boolean
  showQuantity: boolean
  contributorInitial: string | null
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const checked = item.checked
  return (
    <li
      className="flex min-w-0 items-center gap-1 border-b pl-2.5 pr-1.5 last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!canEdit}
        aria-pressed={checked}
        aria-label={`${item.name}, ${checked ? 'plukket' : 'å handle'}`}
        className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center"
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${checked ? 'eh-anim-pop' : ''}`}
          style={{
            borderColor: checked ? 'var(--primary)' : 'var(--border)',
            background: checked ? 'var(--primary)' : 'transparent',
          }}
        >
          {checked && <Check size={15} color="#fff" strokeWidth={3} aria-hidden />}
        </span>
      </button>

      <button
        type="button"
        onClick={() => canEdit && onToggle()}
        disabled={!canEdit}
        className="flex min-h-[52px] min-w-0 flex-1 touch-manipulation items-center gap-2 py-2 text-left"
      >
        <span
          className={`min-w-0 flex-1 truncate text-[15px] ${checked ? 'line-through' : ''}`}
          style={{ color: checked ? 'var(--text-muted)' : 'var(--text)' }}
        >
          {item.name}
        </span>
        {showQuantity && item.quantity != null && item.quantity > 0 && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            × {item.quantity}
          </span>
        )}
      </button>

      {contributorInitial && (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: 'var(--accent)', color: 'var(--text)' }}
          title={contributorInitial}
        >
          {contributorInitial.charAt(0).toUpperCase()}
        </span>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Rediger"
          className="inline-flex h-11 w-9 shrink-0 touch-manipulation items-center justify-center rounded-xl active:opacity-60"
          style={{ color: 'var(--text-muted)' }}
        >
          <Pencil size={16} aria-hidden />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Slett"
          className="inline-flex h-11 w-9 shrink-0 touch-manipulation items-center justify-center rounded-xl active:opacity-60"
          style={{ color: 'var(--danger)' }}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      )}
    </li>
  )
}
