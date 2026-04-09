'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BudgetCategory } from '@/lib/store'
import { ChevronDown, Search } from 'lucide-react'

type Props = {
  value: string
  onChange: (name: string) => void
  categories: BudgetCategory[]
  disabled?: boolean
  placeholder?: string
  className?: string
  /** `pick`: tom streng = ikke valgt. `filter`: `all` = alle kategorier. */
  variant?: 'pick' | 'filter'
  /** Når false, behold rekkefølgen fra `categories` (f.eks. gruppert etter hovedkategori). */
  sortAlphabetically?: boolean
  id?: string
}

export default function BudgetCategoryPicker({
  value,
  onChange,
  categories,
  disabled,
  placeholder = 'Velg kategori',
  className = '',
  variant = 'pick',
  sortAlphabetically = true,
  id,
}: Props) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const list = useMemo(
    () =>
      sortAlphabetically
        ? [...categories].sort((a, b) => a.name.localeCompare(b.name, 'nb'))
        : [...categories],
    [categories, sortAlphabetically],
  )

  const queryNorm = searchQuery.trim().toLowerCase()

  const filteredList = useMemo(() => {
    if (!queryNorm) return list
    return list.filter((c) => c.name.toLowerCase().includes(queryNorm))
  }, [list, queryNorm])

  const showFilterAllRow =
    variant === 'filter' &&
    (!queryNorm || 'alle kategorier'.toLowerCase().includes(queryNorm))

  const showPickPlaceholderRow = variant === 'pick' && !queryNorm

  const displayLabel = useMemo(() => {
    if (variant === 'filter') {
      if (value === 'all') return 'Alle kategorier'
      return list.find((c) => c.name === value)?.name ?? value
    }
    if (!value) return placeholder
    return list.find((c) => c.name === value)?.name ?? value
  }, [value, variant, placeholder, list])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) setSearchQuery('')
  }, [open])

  const btnClass =
    `flex w-full items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-left min-h-[2.5rem] ` +
    (className ? `${className} ` : '')

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={btnClass}
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={16} className="shrink-0 opacity-70" aria-hidden />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(15, 23, 42, 0.45)' }}
            onClick={() => setOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-md max-h-[min(70vh,calc(100vh-3rem))] flex flex-col rounded-2xl p-4 shadow-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
              role="listbox"
            >
              <p className="text-xs font-medium mb-2 shrink-0" style={{ color: 'var(--text-muted)' }}>
                {variant === 'filter' ? 'Filtrer på kategori' : 'Velg kategori'}
              </p>
              <label className="relative mb-3 block shrink-0">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søk i kategorier …"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                  aria-label="Søk i kategorier"
                />
              </label>
              <div className="min-h-0 flex-1 overflow-y-auto space-y-1 pr-0.5 -mr-0.5">
                {showFilterAllRow && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-90"
                    style={{
                      background: value === 'all' ? 'var(--bg)' : 'transparent',
                      color: 'var(--text)',
                    }}
                    onClick={() => {
                      onChange('all')
                      setOpen(false)
                    }}
                  >
                    Alle kategorier
                  </button>
                )}
                {showPickPlaceholderRow && (
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-90"
                    style={{
                      background: !value ? 'var(--bg)' : 'transparent',
                      color: 'var(--text-muted)',
                    }}
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                    }}
                  >
                    {placeholder}
                  </button>
                )}
                {filteredList.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-90"
                    style={{
                      background:
                        (variant === 'filter' ? value === c.name : value === c.name) ? 'var(--bg)' : 'transparent',
                      color: 'var(--text)',
                    }}
                    onClick={() => {
                      onChange(c.name)
                      setOpen(false)
                    }}
                  >
                    {c.name}
                  </button>
                ))}
                {queryNorm && filteredList.length === 0 && !showFilterAllRow && (
                  <p className="px-3 py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    Ingen treff. Prøv et annet søk.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
