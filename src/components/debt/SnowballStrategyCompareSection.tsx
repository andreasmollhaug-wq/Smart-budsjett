'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNOK } from '@/lib/utils'
import SnowballDemoCompareVisuals from '@/components/marketing/snowball/SnowballDemoCompareVisuals'

export default function SnowballStrategyCompareSection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden min-w-0" style={{ border: '1px solid var(--border)' }}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 min-h-[44px] px-4 py-3 text-left touch-manipulation"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Vis mer</span>
          <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Eksempel på sammenligning Snøball vs Avalanche
          </span>
        </span>
        <ChevronDown
          size={20}
          className="shrink-0 transition-transform duration-200"
          style={{ color: 'var(--primary)', transform: open ? 'rotate(180deg)' : undefined }}
          aria-hidden
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 min-w-0 border-t" style={{ borderColor: 'var(--border)' }}>
          <SnowballDemoCompareVisuals formatNOK={formatNOK} showDemoBanner />
        </div>
      )}
    </div>
  )
}
