'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  titleId: string
  children: ReactNode
}

/** Felles modal for veiledning og FAQ — mobil (bottom sheet) og desktop (sentrert). */
export default function GuideModalShell({ open, onClose, title, titleId, children }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center overflow-hidden p-0 sm:p-4"
      style={{ background: 'color-mix(in srgb, #000 45%, transparent)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        data-testid="guide-modal-panel"
        className="flex w-full max-w-lg min-w-0 max-h-[min(90dvh,90vh)] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl shadow-lg"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-[1] flex shrink-0 items-start justify-between gap-3 border-b pt-4 pb-3 min-w-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 id={titleId} className="text-lg font-semibold break-words m-0 min-w-0 flex-1" style={{ color: 'var(--text)' }}>
            {title}
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
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain py-4 break-words">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
