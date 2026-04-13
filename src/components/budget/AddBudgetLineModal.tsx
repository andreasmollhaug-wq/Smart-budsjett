'use client'
import { useEffect, useMemo, useRef } from 'react'
import type { BudgetCategory } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { BUDGET_MONTH_LABELS_NB, parseThousands } from '@/lib/utils'
import { Info, X } from 'lucide-react'

function amountPlaceholder(freq: BudgetCategory['frequency']): string {
  switch (freq) {
    case 'monthly':
      return 'Beløp per måned'
    case 'yearly':
      return 'Beløp per år'
    case 'quarterly':
      return 'Beløp per kvartal'
    case 'semiAnnual':
      return 'Beløp per halvår'
    case 'weekly':
      return 'Beløp per uke'
    case 'once':
      return 'Beløp (én gang)'
    default:
      return 'Beløp'
  }
}

type Props = {
  open: boolean
  group: ParentCategory | null
  groupLabel: string
  search: string
  onSearchChange: (v: string) => void
  available: string[]
  onPickSuggestion: (name: string) => void
  newForm: { name: string; amount: string; freq: BudgetCategory['frequency']; onceMonthIndex: number }
  onNewFormChange: (f: {
    name: string
    amount: string
    freq: BudgetCategory['frequency']
    onceMonthIndex: number
  }) => void
  onAddCustom: () => void
  onClose: () => void
  /** Økes når bruker velger et forslag; fokuserer beløpsfeltet. */
  focusAmountSignal?: number
}

export default function AddBudgetLineModal({
  open,
  group,
  groupLabel,
  search,
  onSearchChange,
  available,
  onPickSuggestion,
  newForm,
  onNewFormChange,
  onAddCustom,
  onClose,
  focusAmountSignal = 0,
}: Props) {
  const amountInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available.slice(0, 8)
    return available.filter((a) => a.toLowerCase().includes(q)).slice(0, 12)
  }, [available, search])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || focusAmountSignal <= 0) return
    requestAnimationFrame(() => {
      amountInputRef.current?.focus()
    })
  }, [focusAmountSignal, open])

  if (!open || !group) return null

  const ph = amountPlaceholder(newForm.freq)
  const canSubmitCustom = Boolean(newForm.name.trim() && newForm.amount.trim())

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md min-w-0 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
            Legg til linje · {groupLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Søk blant forslag, eller legg til eget navn og beløp nedenfor.
        </p>

        <input
          type="search"
          placeholder="Søk…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full mt-3 px-3 py-2 text-sm rounded-xl font-sans"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          autoFocus
        />

        {filtered.length > 0 && (
          <ul className="mt-2 rounded-xl border max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:opacity-90"
                  style={{ background: 'transparent', color: 'var(--text)' }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickSuggestion(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Navn og beløp
          </p>
          <div className="space-y-2">
            <input
              placeholder="Navn"
              value={newForm.name}
              onChange={(e) => onNewFormChange({ ...newForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl font-sans"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
              <input
                ref={amountInputRef}
                placeholder={ph}
                type="text"
                inputMode="decimal"
                value={newForm.amount ? Number(newForm.amount).toLocaleString('nb-NO') : ''}
                onChange={(e) =>
                  onNewFormChange({ ...newForm, amount: parseThousands(e.target.value).toString() })
                }
                className="min-w-0 px-3 py-2 text-sm rounded-xl font-sans"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <div className="group/freq min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Frekvens
                  </span>
                  <button
                    type="button"
                    className="p-0.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Forklaring av frekvens"
                  >
                    <Info size={14} strokeWidth={2} />
                  </button>
                </div>
                <div
                  role="note"
                  className="max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-150 ease-out group-hover/freq:max-h-40 group-hover/freq:opacity-100 group-focus-within/freq:max-h-40 group-focus-within/freq:opacity-100"
                >
                  <p
                    className="rounded-lg border px-2.5 py-2 text-xs leading-snug break-words"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Månedlig, årlig (÷12) og ukentlig (omtrent månedlig nivå) fylles jevnt. Kvartalsvis
                    settes beløpet i jan/apr/jul/okt; halvårlig i jan og jul; én gang i én valgfri måned.
                  </p>
                </div>
                <select
                  value={newForm.freq}
                  onChange={(e) =>
                    onNewFormChange({ ...newForm, freq: e.target.value as BudgetCategory['frequency'] })
                  }
                  className="w-full min-w-0 px-3 py-2 text-sm rounded-xl"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="monthly">Månedlig</option>
                  <option value="quarterly">Kvartalsvis</option>
                  <option value="semiAnnual">Halvårlig</option>
                  <option value="yearly">Årlig</option>
                  <option value="weekly">Ukentlig</option>
                  <option value="once">Én gang</option>
                </select>
              </div>
            </div>
            {newForm.freq === 'once' && (
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Hvilken måned?
                </span>
                <select
                  value={newForm.onceMonthIndex}
                  onChange={(e) =>
                    onNewFormChange({ ...newForm, onceMonthIndex: Number(e.target.value) })
                  }
                  className="w-full min-w-0 px-3 py-2 text-sm rounded-xl"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  aria-label="Måned for engangsbudsjett"
                >
                  {BUDGET_MONTH_LABELS_NB.map((label, i) => (
                    <option key={label} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={onAddCustom}
              disabled={!canSubmitCustom}
              title={
                !canSubmitCustom
                  ? 'Fyll inn navn og beløp (beløp kan ikke være tomt).'
                  : undefined
              }
              className="w-full px-3 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-45 disabled:cursor-not-allowed"
              style={{ background: 'var(--primary)' }}
            >
              Legg til egendefinert
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
