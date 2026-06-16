'use client'

import { Info } from 'lucide-react'

type Props = {
  onClick: () => void
  /** Kort variant ved siden av «Kom i gang»-tittel */
  compact?: boolean
}

export default function CreditorRegistryInfoTrigger({ onClick, compact = false }: Props) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl touch-manipulation shrink-0"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Slik kan oversikt gjeld se ut"
        title="Slik kan oversikten se ut"
      >
        <Info size={18} strokeWidth={2} aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium touch-manipulation w-full sm:w-auto"
      style={{
        color: 'var(--text)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
      }}
    >
      <Info size={18} strokeWidth={2} aria-hidden />
      Slik kan oversikten se ut
    </button>
  )
}
