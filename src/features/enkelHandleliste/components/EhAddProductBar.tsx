'use client'

import { useMemo, useRef, useState } from 'react'
import { Plus, Search, Sparkles } from 'lucide-react'
import { suggestProducts } from '@/lib/groceries/suggestProducts'
import { useEnkelHandlelisteStore } from '../enkelHandlelisteStore'

export function EhAddProductBar({
  disabled,
  onAddNames,
}: {
  disabled: boolean
  onAddNames: (names: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const personal = useEnkelHandlelisteStore((s) => s.personalProducts)

  const trimmed = query.trim()

  const suggestions = useMemo(
    () =>
      suggestProducts(query, personal).map((s) => ({
        ...s,
        key: `${s.source}-${s.normalizedKey}`,
      })),
    [query, personal],
  )

  const quickPicks = useMemo(
    () => (focused && !trimmed ? suggestProducts('', personal, { limit: 10 }) : []),
    [focused, trimmed, personal],
  )

  const submitRaw = (raw: string) => {
    const t = raw.trim()
    if (!t || disabled) return
    onAddNames([t])
    setQuery('')
    inputRef.current?.focus()
  }

  const pick = (displayName: string) => {
    if (disabled) return
    onAddNames([displayName])
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[85]"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        {/* Live forslag */}
        {trimmed && suggestions.length > 0 && (
          <ul
            className="eh-anim-fade mb-2 max-h-[260px] overflow-y-auto rounded-2xl border p-1.5"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              boxShadow: '0 12px 32px rgba(13,18,38,0.16)',
            }}
            role="listbox"
          >
            {suggestions.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  data-testid="eh-suggest-item"
                  className="flex min-h-[48px] w-full touch-manipulation items-center gap-3 rounded-xl px-3 text-left active:scale-[0.99]"
                  style={{ color: 'var(--text)' }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s.displayName)}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                  >
                    <Plus size={15} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{s.displayName}</span>
                  <span
                    className="shrink-0 text-[11px] font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {s.source === 'personal' ? 'Din' : s.source === 'quick' ? 'Vanlig' : 'Katalog'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Hurtigvalg-chips når feltet er tomt og fokusert */}
        {quickPicks.length > 0 && (
          <div className="eh-anim-fade mb-2 flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {quickPicks.map((s) => (
              <button
                key={`qp-${s.normalizedKey}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s.displayName)}
                className="inline-flex shrink-0 touch-manipulation items-center gap-1 rounded-full border px-3.5 py-2 text-sm font-medium active:scale-95"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {s.source === 'personal' ? (
                  <Sparkles size={13} style={{ color: 'var(--primary)' }} aria-hidden />
                ) : null}
                {s.displayName}
              </button>
            ))}
          </div>
        )}

        {/* Søke-/legg-til-felt */}
        <div
          className="flex items-center gap-2 rounded-2xl border p-1.5"
          style={{
            borderColor: focused ? 'var(--primary)' : 'var(--border)',
            background: 'var(--surface)',
            boxShadow: '0 8px 28px rgba(13,18,38,0.14)',
          }}
        >
          <Search size={20} className="ml-2 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitRaw(query)
              }
            }}
            disabled={disabled}
            placeholder="Søk eller skriv en vare…"
            className="min-h-[44px] min-w-0 flex-1 bg-transparent text-base outline-none"
            style={{ color: 'var(--text)' }}
            autoComplete="off"
            enterKeyHint="done"
          />
          <button
            type="button"
            disabled={disabled || !trimmed}
            aria-label="Legg til"
            className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-white transition-[transform,opacity] active:scale-95 disabled:opacity-30"
            style={{ background: 'var(--cta-gradient)' }}
            onClick={() => submitRaw(query)}
          >
            <Plus size={22} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
