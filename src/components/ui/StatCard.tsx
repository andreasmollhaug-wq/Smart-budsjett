'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react'

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color,
  info,
  onClick,
  'aria-label': ariaLabel,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  trend?: 'up' | 'down'
  color: string
  /** Lang forklaring som vises i popup når brukeren trykker info-ikonet ved siden av tittelen */
  info?: string
  /** Gjør kortet klikkbart (f.eks. åpne oversikt). Ikke kombiner med `info` — bruk da `div`-wrapper utenfor. */
  onClick?: () => void
  'aria-label'?: string
}) {
  const [infoOpen, setInfoOpen] = useState(false)
  const infoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const close = (e: PointerEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [infoOpen])

  const cardClass =
    'rounded-2xl p-4 sm:p-5 flex flex-col gap-3 touch-manipulation' +
    (onClick
      ? ' outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2'
      : '')

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
          {info && (
            <div className="relative flex shrink-0 items-center" ref={infoWrapRef}>
              <button
                type="button"
                onClick={() => setInfoOpen((o) => !o)}
                aria-expanded={infoOpen}
                aria-label={`Mer om: ${label}`}
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 active:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <Info size={18} strokeWidth={2} aria-hidden />
              </button>
              {infoOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1.5 w-[min(calc(100vw-2rem),18rem)] max-w-[calc(100vw-2rem)] rounded-xl p-3 text-left shadow-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  role="region"
                >
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {info}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums sm:text-2xl" style={{ color: 'var(--text)' }}>
          {value}
        </p>
        <div className="mt-1 flex flex-wrap items-start gap-x-1 gap-y-0.5">
          {trend === 'up' ? (
            <ArrowUpRight size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
          ) : trend === 'down' ? (
            <ArrowDownRight size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }} />
          ) : null}
          <p className="min-w-0 flex-1 text-xs leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </p>
        </div>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={`w-full text-left ${cardClass}`}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {inner}
      </button>
    )
  }

  return (
    <div className={cardClass} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {inner}
    </div>
  )
}
