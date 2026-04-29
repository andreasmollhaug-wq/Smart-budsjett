'use client'

import { BookMarked, HelpCircle } from 'lucide-react'
import { useMatHandlelisteTourOptional } from '@/features/matHandleliste/MatHandlelisteTourProvider'

/** Kompakt knapp(er) til Header `titleAddon` — trygg før provider finnes teoretisk alle steder i appen (returner null). */
export default function MatHandlelisteTourHeaderButton() {
  const ctx = useMatHandlelisteTourOptional()
  if (!ctx) return null
  const { startTour, startExtendedTour } = ctx
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => startTour()}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold touch-manipulation sm:px-3 sm:text-sm"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--primary)',
          background: 'var(--primary-pale)',
        }}
        aria-label="Vis meg rundt i mat og handleliste"
      >
        <HelpCircle size={18} aria-hidden />
        <span className="hidden sm:inline">Vis meg rundt</span>
      </button>
      <button
        type="button"
        onClick={() => startExtendedTour()}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border px-2.5 text-xs font-semibold touch-manipulation sm:px-3 sm:text-sm"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text)',
          background: 'var(--bg)',
        }}
        aria-label="Utvidet gjennomgang i mat og handleliste"
        title="Utvidet gjennomgang"
      >
        <BookMarked size={17} aria-hidden />
        <span className="hidden sm:inline">Utvidet</span>
      </button>
    </div>
  )
}
