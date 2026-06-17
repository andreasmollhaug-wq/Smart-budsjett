'use client'

import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Felles overlay/ark for hele modulen.
 * - Mobil: bunnark som glir opp, med dra-håndtak og safe-area.
 * - Desktop (sm+): sentrert kort.
 * Lukkes ved klikk på bakgrunn og Escape, og låser bakgrunnsscroll.
 */
export function EhSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  zIndexClass = 'z-[100]',
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md'
  zIndexClass?: string
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-md'

  return (
    <div
      className={`eh-anim-fade fixed inset-0 ${zIndexClass} flex items-end justify-center sm:items-center sm:p-4`}
      style={{ background: 'rgba(13, 18, 38, 0.45)', backdropFilter: 'blur(2px)' }}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`eh-anim-sheet flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-t-3xl border sm:rounded-3xl`}
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 -8px 40px rgba(13,18,38,0.18)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full sm:hidden" style={{ background: 'var(--border)' }} />

        {title && (
          <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Lukk"
              className="-mr-1.5 -mt-1 inline-flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-full transition-opacity active:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={22} aria-hidden />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2">{children}</div>

        {footer && (
          <div
            className="shrink-0 px-5 pb-5 pt-3"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
