'use client'

import { BookMarked, HelpCircle } from 'lucide-react'
import { useSmartvaneTourOptional } from '@/features/smartvane/SmartvaneTourProvider'

/** Kompakt knapp(er) i topplist på I dag / Måned / Innsikt — trygg utenfor provider (null). */
export default function SmartvaneTourHeaderButton() {
  const ctx = useSmartvaneTourOptional()
  if (!ctx) return null
  const { startTour, startExtendedTour } = ctx
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
      <button
        type="button"
        onClick={() => startTour()}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border px-2 text-xs font-semibold touch-manipulation"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--primary)',
          background: 'var(--primary-pale)',
        }}
        aria-label="Vis meg rundt i SmartVane"
      >
        <HelpCircle size={18} aria-hidden />
        <span className="hidden sm:inline">Rundtur</span>
      </button>
      <button
        type="button"
        onClick={() => startExtendedTour()}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border px-2 text-xs font-semibold touch-manipulation"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text)',
          background: 'var(--bg)',
        }}
        aria-label="Utvidet gjennomgang i SmartVane"
        title="Utvidet gjennomgang"
      >
        <BookMarked size={17} aria-hidden />
        <span className="hidden sm:inline">Utvidet</span>
      </button>
    </div>
  )
}
