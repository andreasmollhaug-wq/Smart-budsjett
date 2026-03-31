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
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  trend?: 'up' | 'down'
  color: string
  /** Lang forklaring som vises i popup når brukeren trykker info-ikonet ved siden av tittelen */
  info?: string
}) {
  const [infoOpen, setInfoOpen] = useState(false)
  const infoWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!infoOpen) return
    const close = (e: MouseEvent) => {
      if (infoWrapRef.current && !infoWrapRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [infoOpen])

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1 min-w-0 flex-1">
          <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
          {info && (
            <div className="relative shrink-0 pt-0.5" ref={infoWrapRef}>
              <button
                type="button"
                onClick={() => setInfoOpen((o) => !o)}
                aria-expanded={infoOpen}
                aria-label={`Mer om: ${label}`}
                className="p-0.5 rounded-md -m-0.5 transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <Info size={15} strokeWidth={2} aria-hidden />
              </button>
              {infoOpen && (
                <div
                  className="absolute left-0 top-full z-50 mt-1.5 w-[min(calc(100vw-2rem),18rem)] rounded-xl p-3 text-left shadow-lg"
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
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {value}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <ArrowUpRight size={14} style={{ color: 'var(--success)' }} />
          ) : trend === 'down' ? (
            <ArrowDownRight size={14} style={{ color: 'var(--danger)' }} />
          ) : null}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  )
}
