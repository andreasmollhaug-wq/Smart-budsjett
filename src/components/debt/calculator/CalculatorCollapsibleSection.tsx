'use client'

import { ChevronDown } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import InfoPopover from '@/components/ui/InfoPopover'

type InfoPopoverProps = {
  title: string
  text: string
}

type Props = {
  title: string
  titleIcon?: ReactNode
  subtitle?: string
  summary?: ReactNode
  info?: InfoPopoverProps
  open: boolean
  onToggle: () => void
  children: ReactNode
  /** Innfelt blokk (grå bakgrunn) vs. seksjon med border */
  variant?: 'inset' | 'plain'
}

export default function CalculatorCollapsibleSection({
  title,
  titleIcon,
  subtitle,
  summary,
  info,
  open,
  onToggle,
  children,
  variant = 'inset',
}: Props) {
  const contentId = useId()
  const triggerId = `${contentId}-trigger`

  const shellClass =
    variant === 'inset'
      ? 'rounded-xl p-4 space-y-0'
      : 'space-y-0 pt-2 border-t'

  const shellStyle =
    variant === 'inset'
      ? { background: 'var(--bg)', border: '1px solid var(--border)' }
      : { borderColor: 'var(--border)' }

  return (
    <div className={shellClass} style={shellStyle}>
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
        className="w-full min-h-[44px] text-left flex items-start justify-between gap-3 rounded-xl -m-1 p-1 touch-manipulation transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--primary)]"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <span className="font-semibold text-sm flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: 'var(--text)' }}>
            {titleIcon}
            {title}
            {info && (
              <span
                className="inline-flex"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <InfoPopover title={info.title} text={info.text} />
              </span>
            )}
          </span>
          {subtitle && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
          {!open && summary && (
            <p className="text-sm pt-0.5 leading-relaxed tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {summary}
            </p>
          )}
        </div>
        <ChevronDown
          size={20}
          className="shrink-0 mt-0.5 transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : undefined,
            color: 'var(--text-muted)',
          }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          className={`space-y-4 ${variant === 'inset' ? 'pt-4' : 'pt-3'}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
