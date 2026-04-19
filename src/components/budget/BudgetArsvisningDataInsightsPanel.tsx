'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import type { ArsvisningInsightItem } from '@/lib/dashboardOverviewHelpers'

export default function BudgetArsvisningDataInsightsPanel({ items }: { items: ArsvisningInsightItem[] }) {
  const [open, setOpen] = useState(false)

  if (items.length === 0) {
    return (
      <p className="text-sm rounded-xl px-3 py-2" style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        Ingen datainnsikt å vise akkurat nå — budsjett og transaksjoner ser foreløpig konsistente ut for dette året.
      </p>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 min-h-[44px] px-4 py-3 text-left touch-manipulation"
        style={{ color: 'var(--text)' }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Lightbulb className="shrink-0" size={20} style={{ color: 'var(--primary)' }} aria-hidden />
          <span className="font-medium text-sm sm:text-base">Datainnsikt</span>
          <span className="text-xs sm:text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>
            ({items.length})
          </span>
        </span>
        {open ? <ChevronUp size={20} aria-hidden /> : <ChevronDown size={20} aria-hidden />}
      </button>
      {open ? (
        <ul
          className="px-4 pb-4 space-y-3 text-sm border-t"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          aria-live="polite"
        >
          {items.map((it) => (
            <li key={it.id} className="leading-snug">
              {it.href ? (
                <Link href={it.href} className="underline underline-offset-2 hover:opacity-90" style={{ color: 'var(--primary)' }}>
                  {it.text}
                </Link>
              ) : (
                it.text
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
