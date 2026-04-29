'use client'

import { HelpCircle } from 'lucide-react'
import { useSparingAnalyseTourOptional } from '@/features/sparing/SparingAnalyseTourProvider'

export default function SparingAnalyseTourHeaderButton() {
  const ctx = useSparingAnalyseTourOptional()
  if (!ctx) return null
  const { startTour } = ctx
  return (
    <button
      type="button"
      onClick={() => void startTour()}
      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold touch-manipulation sm:px-3 sm:text-sm"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--primary)',
        background: 'var(--primary-pale)',
      }}
      aria-label="Vis meg rundt på sparing analyse"
    >
      <HelpCircle size={18} aria-hidden />
      <span className="hidden sm:inline">Vis meg rundt</span>
    </button>
  )
}
