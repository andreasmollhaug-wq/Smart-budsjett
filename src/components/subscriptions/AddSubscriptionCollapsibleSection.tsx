'use client'

import { useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { subscriptionAddFormCollapsedHint } from '@/lib/subscriptionGuideCopy'

type Props = {
  open: boolean
  onToggle: () => void
  collapsedSummary?: string
  onOpenGuide: () => void
  children: ReactNode
}

export default function AddSubscriptionCollapsibleSection({
  open,
  onToggle,
  collapsedSummary,
  onOpenGuide,
  children,
}: Props) {
  const contentId = useId()
  const triggerId = `${contentId}-trigger`

  return (
    <section
      className="rounded-2xl border min-w-0 overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="px-4 py-3 sm:px-5 sm:py-3">
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className="w-full text-left flex items-start justify-between gap-2 rounded-lg -m-1 p-1 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--primary)]"
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold m-0" style={{ color: 'var(--text)' }}>
              Legg til abonnement
            </h2>
            {!open && (
              <p className="text-xs mt-1 m-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {collapsedSummary ?? subscriptionAddFormCollapsedHint}
              </p>
            )}
          </div>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="shrink-0 mt-0.5 opacity-45 transition-transform duration-200 ease-out"
            style={{ transform: open ? 'rotate(180deg)' : undefined, color: 'var(--text-muted)' }}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenGuide()
          }}
          data-testid="subscription-guide-trigger"
          className="text-xs font-medium touch-manipulation underline-offset-2 hover:underline py-1 self-start text-left mt-0.5"
          style={{ color: 'var(--primary)' }}
        >
          Slik fungerer abonnementer
        </button>
      </div>

      {open && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {children}
        </div>
      )}
    </section>
  )
}
