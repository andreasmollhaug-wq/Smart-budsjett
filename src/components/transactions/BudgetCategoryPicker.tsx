'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BudgetCategory } from '@/lib/store'
import { ChevronDown } from 'lucide-react'

type Props = {
  value: string
  onChange: (name: string) => void
  categories: BudgetCategory[]
  disabled?: boolean
  placeholder?: string
  className?: string
  /** `pick`: tom streng = ikke valgt. `filter`: `all` = alle kategorier. */
  variant?: 'pick' | 'filter'
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
  id,
}: Props) {
  const [open, setOpen] = useState(false)
  const list = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'nb')),
    [categories],
  )

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
      {open && (
        <div
          className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(15, 23, 42, 0.45)' }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md max-h-[min(70vh,calc(100vh-3rem))] overflow-y-auto rounded-2xl p-4 shadow-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
            role="listbox"
          >
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
              {variant === 'filter' ? 'Filtrer på kategori' : 'Velg kategori'}
            </p>
            <div className="space-y-1">
              {variant === 'filter' && (
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
              {variant === 'pick' && (
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
              {list.map((c) => (
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}
