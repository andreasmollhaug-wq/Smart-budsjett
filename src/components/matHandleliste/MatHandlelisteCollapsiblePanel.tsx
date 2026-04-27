'use client'

import { Minus, Plus } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

/**
 * Sammenleggbart panel med +/- på alle skjermstørrelser.
 * (Eldre versjon skjulte toggle fra og med 768px — da så desktop-brukere aldri lukking.)
 */
export function MatHandlelisteCollapsiblePanel({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <button
        type="button"
        className="flex w-full min-h-[44px] items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold touch-manipulation"
        style={{ color: 'var(--text)' }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>{title}</span>
        <span className="shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden>
          {open ? <Minus size={18} strokeWidth={2} /> : <Plus size={18} strokeWidth={2} />}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="space-y-4 border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border)' }}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
