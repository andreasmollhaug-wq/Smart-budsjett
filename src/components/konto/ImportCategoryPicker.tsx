'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import NewBudgetCategoryModal from '@/components/transactions/NewBudgetCategoryModal'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import { ChevronDown, Plus, Search } from 'lucide-react'

export type ImportCategoryPickerProps = {
  value: string
  onChange: (categoryName: string | null) => void
  categories: BudgetCategory[]
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<ParentCategory, string[]>
  addBudgetCategory: (c: BudgetCategory) => void
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  disabled?: boolean
  /** Unik id-prefix for aria (én rad i liste) */
  fieldId: string
}

export default function ImportCategoryPicker({
  value,
  onChange,
  categories,
  budgetCategories,
  customBudgetLabels,
  addBudgetCategory,
  addCustomBudgetLabel,
  disabled,
  fieldId,
}: ImportCategoryPickerProps) {
  const reactId = useId()
  const listboxId = `${fieldId}-${reactId}-listbox`
  const buttonId = `${fieldId}-${reactId}-btn`

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [newCatOpen, setNewCatOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'nb'))
    if (!q) return sorted
    return sorted.filter((c) => c.name.toLowerCase().includes(q))
  }, [categories, query])

  const selectedMeta = useMemo(() => categories.find((c) => c.name === value), [categories, value])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const typeLabel = useCallback((c: BudgetCategory) => (c.type === 'income' ? 'inntekt' : 'utgift'), [])

  const displayLabel = value
    ? `${value}${selectedMeta ? ` (${typeLabel(selectedMeta)})` : ''}`
    : '— Velg kategori —'

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <button
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return
          setOpen((o) => !o)
          if (!open) setQuery('')
        }}
        className="w-full min-h-[44px] flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-left touch-manipulation disabled:opacity-50"
        style={{ border: '1px solid var(--border)', background: '#fff', color: value ? 'var(--text)' : 'var(--text-muted)' }}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDown size={18} className="shrink-0 opacity-70" style={{ color: 'var(--text-muted)' }} aria-hidden />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute z-[100] left-0 right-0 mt-1 rounded-2xl overflow-hidden flex flex-col shadow-lg max-h-[min(22rem,70vh)]"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <Search size={16} className="shrink-0 opacity-60" style={{ color: 'var(--text-muted)' }} aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk i kategorier…"
              className="min-w-0 flex-1 min-h-[40px] py-2 text-sm bg-transparent outline-none"
              style={{ color: 'var(--text)' }}
              aria-label="Søk i kategorier"
            />
          </div>

          <ul className="min-h-0 overflow-y-auto overscroll-contain py-1" role="presentation">
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className="w-full text-left px-3 py-2.5 text-sm touch-manipulation rounded-lg mx-1"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                  setQuery('')
                }}
              >
                Ingen valgt
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Ingen treff. Prøv et annet søk eller opprett en ny kategori.
              </li>
            ) : (
              filtered.map((c) => (
                <li key={`${c.name}-${c.type}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === c.name}
                    className="w-full text-left px-3 py-2.5 text-sm touch-manipulation rounded-lg mx-1 hover:opacity-95"
                    style={{
                      background: value === c.name ? 'var(--primary-pale)' : 'transparent',
                      color: 'var(--text)',
                    }}
                    onClick={() => {
                      onChange(c.name)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs ml-2 opacity-75" style={{ color: 'var(--text-muted)' }}>
                      {typeLabel(c)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <div
            className="shrink-0 border-t p-2"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <button
              type="button"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium touch-manipulation"
              style={{
                border: '1px dashed var(--border)',
                color: 'var(--primary)',
                background: 'var(--surface)',
              }}
              onClick={() => {
                setNewCatOpen(true)
                setOpen(false)
                setQuery('')
              }}
            >
              <Plus size={18} aria-hidden />
              Ny kategori
            </button>
          </div>
        </div>
      )}

      <NewBudgetCategoryModal
        open={newCatOpen}
        onClose={() => setNewCatOpen(false)}
        onCreated={({ name }) => {
          onChange(name)
        }}
        customBudgetLabels={customBudgetLabels}
        budgetCategories={budgetCategories}
        addCustomBudgetLabel={addCustomBudgetLabel}
        addBudgetCategory={addBudgetCategory}
        dialogTitle="Ny kategori"
        dialogDescription="Opprettes med 0 kr planlagt beløp per måned. Du kan justere under Budsjett når du vil. Importen bruker kategorien med én gang."
        submitLabel="Opprett og bruk"
      />
    </div>
  )
}
