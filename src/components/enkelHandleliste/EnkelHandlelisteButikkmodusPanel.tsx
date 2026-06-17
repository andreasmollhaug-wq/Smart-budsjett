'use client'

import { useEffect, useId, useMemo } from 'react'
import { Check, PartyPopper, X } from 'lucide-react'
import { useScreenWakeLock } from '@/lib/hooks/useScreenWakeLock'
import type { EhItem } from '@/features/enkelHandleliste/types'

export function EnkelHandlelisteButikkmodusPanel({
  open,
  onClose,
  items,
  toggleItem,
}: {
  open: boolean
  onClose: () => void
  items: EhItem[]
  toggleItem: (id: string) => void
}) {
  const titleId = useId()
  const wakeStatus = useScreenWakeLock(open)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])

  const remaining = useMemo(
    () => items.filter((it) => !it.checked).sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  )
  const total = items.length
  const picked = total - remaining.length
  const progress = total === 0 ? 0 : Math.round((picked / total) * 100)

  if (!open) return null

  return (
    <div
      className="eh-anim-fade fixed inset-0 z-[100] flex flex-col"
      style={{
        background: 'var(--bg)',
        paddingLeft: 'max(0.625rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.625rem, env(safe-area-inset-right))',
        paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header
        className="shrink-0 px-2 pb-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 id={titleId} className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Butikkmodus
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {total === 0 ? 'Ingen varer' : `${picked} av ${total} i kurven`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk butikkmodus"
            className="inline-flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl border active:scale-95"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            <X size={24} aria-hidden />
          </button>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--primary-pale)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%`, background: 'var(--cta-gradient)' }}
          />
        </div>
        {wakeStatus === 'unsupported' && (
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Skjermen kan slukke — slå av auto-lås i telefoninnstillinger ved behov.
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
        {remaining.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
            >
              <PartyPopper size={36} aria-hidden />
            </span>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Alt er i kurven!
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen varer gjenstår.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {remaining.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => toggleItem(it.id)}
                  className="flex min-h-[68px] w-full touch-manipulation items-center gap-4 rounded-2xl border px-4 text-left transition-[transform] active:scale-[0.98]"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                    boxShadow: '0 1px 2px rgba(30,43,79,0.04), 0 4px 14px rgba(30,43,79,0.06)',
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
                    style={{ borderColor: 'var(--primary)' }}
                  >
                    <Check size={20} style={{ color: 'var(--primary)' }} strokeWidth={3} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
                    {it.name}
                  </span>
                  {it.quantity != null && it.quantity > 0 && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums"
                      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                    >
                      × {it.quantity}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
