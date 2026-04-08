'use client'

import { useEffect, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { householdSingleLoginNote } from '@/lib/kontoCopy'

export default function MfaInfoPopover() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-flex shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded-lg"
        style={{ color: 'var(--text-muted)' }}
        aria-expanded={open}
        aria-label="Mer om tofaktor og husholdning"
      >
        <HelpCircle size={18} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl p-4 text-sm shadow-lg"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <p className="font-medium mb-2">Tofaktor</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Tofaktorautentisering kommer i neste release.
          </p>
          <p className="font-medium mb-2">Husholdning og innlogging</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {householdSingleLoginNote} Du bytter profil i appen under «Viser data for».
          </p>
          <p className="font-medium mb-2">På sikt</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Vi utvikler mot at ett abonnement kan knyttes til flere e-poster (for eksempel opptil fem), slik at hver kan
            logge inn med egen adresse.
          </p>
        </div>
      )}
    </div>
  )
}
