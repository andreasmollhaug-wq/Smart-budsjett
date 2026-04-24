'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

/** Kompakt info-knapp med samme interaksjon som `StatCard` (pointerdown lukk, touch-mål). */
export default function InfoPopover({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="relative inline-flex shrink-0 items-center" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Mer om: ${title}`}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-opacity hover:opacity-80 active:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        <Info size={18} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[60] mt-1.5 w-[min(calc(100vw-2rem),18rem)] max-w-[min(calc(100vw-2rem),18rem)] rounded-xl p-3 text-left shadow-lg touch-manipulation"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          role="region"
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {text}
          </p>
        </div>
      )}
    </div>
  )
}
