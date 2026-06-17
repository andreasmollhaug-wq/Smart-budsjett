'use client'

import { ChevronRight } from 'lucide-react'
import { EhSheet } from './EhSheet'
import type { EhList } from '../types'

export function EnkelHandlelisteListPickerSheet({
  open,
  title,
  lists,
  onClose,
  onPick,
}: {
  open: boolean
  title: string
  lists: EhList[]
  onClose: () => void
  onPick: (listId: string) => void
}) {
  return (
    <EhSheet open={open} onClose={onClose} title={title}>
      {lists.length === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen andre lister tilgjengelig.
        </p>
      ) : (
        <ul className="space-y-2 pb-4">
          {lists.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                className="flex min-h-[56px] w-full touch-manipulation items-center justify-between gap-3 rounded-2xl border px-4 text-left text-[15px] font-medium transition-[transform] active:scale-[0.99]"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                onClick={() => {
                  onPick(l.id)
                  onClose()
                }}
              >
                <span className="min-w-0 truncate">{l.name}</span>
                <ChevronRight size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </EhSheet>
  )
}
