'use client'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { BudgetCategory } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { formatMoneyInputFromNumber, parsePositiveMoneyAmount2Decimals } from '@/lib/money/parseNorwegianAmount'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { useFormattedMoneyInput } from '@/lib/useFormattedMoneyInput'
import { BUDGET_MONTH_LABELS_NB } from '@/lib/utils'
import { Info, X } from 'lucide-react'
import type { PersonProfile } from '@/lib/store'
import HouseholdBudgetSplitSection, {
  type HouseholdSplitFormState,
} from '@/components/budget/HouseholdBudgetSplitSection'

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

export type IncomeWithholdingNewLineFields = {
  incomeWhApply: boolean
  incomeWhPercent: string
}

export type AddBudgetLineFormWithHousehold = {
  name: string
  amount: string
  freq: BudgetCategory['frequency']
  onceMonthIndex: number
  householdSplit: HouseholdSplitFormState
} & IncomeWithholdingNewLineFields

type Props = {
  open: boolean
  group: ParentCategory | null
  groupLabel: string
  search: string
  onSearchChange: (v: string) => void
  available: string[]
  onPickSuggestion: (name: string) => void
  newForm: {
    name: string
    amount: string
    freq: BudgetCategory['frequency']
    onceMonthIndex: number
  } & IncomeWithholdingNewLineFields & { householdSplit: HouseholdSplitFormState }
  onNewFormChange: (f: Props['newForm']) => void
  onAddCustom: () => void
  onClose: () => void
  /** Økes når bruker velger et forslag; fokuserer beløpsfeltet. */
  focusAmountSignal?: number
  showHouseholdSplitBlock?: boolean
  profilesForHousehold?: PersonProfile[]
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
  showHouseholdSplitBlock = false,
  profilesForHousehold = [],
}: Props) {
  const amountInputRef = useRef<HTMLInputElement>(null)
  const [freqHelpOpen, setFreqHelpOpen] = useState(false)
  const freqSelectId = useId()
  const freqHelpPanelId = useId()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available.slice(0, 8)
    return available.filter((a) => a.toLowerCase().includes(q)).slice(0, 12)
  }, [available, search])

  useEffect(() => {
    if (open) setFreqHelpOpen(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (freqHelpOpen) {
        e.preventDefault()
        setFreqHelpOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, freqHelpOpen])

  useEffect(() => {
    if (!open || focusAmountSignal <= 0) return
    requestAnimationFrame(() => {
      amountInputRef.current?.focus()
    })
  }, [focusAmountSignal, open])

  const setAmountStr = useCallback(
    (v: string) => onNewFormChange({ ...newForm, amount: v }),
    [newForm, onNewFormChange],
  )
  const amountMoney = useFormattedMoneyInput(newForm.amount, setAmountStr)
  const backdropDismiss = useModalBackdropDismiss(onClose)

  if (!open || !group) return null

  const ph = amountPlaceholder(newForm.freq)
  const canSubmitCustom = Boolean(newForm.name.trim() && newForm.amount.trim())

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      {...backdropDismiss}
    >
      <div
        className="w-full max-w-md min-w-0 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-x-hidden overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <h3 className="font-semibold text-lg min-w-0 pr-2" style={{ color: 'var(--text)' }}>
            Legg til linje · {groupLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg shrink-0 touch-manipulation"
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
          className="w-full mt-3 min-h-[44px] px-3 py-2 text-sm rounded-xl font-sans touch-manipulation"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          autoFocus
        />

        {filtered.length > 0 && (
          <ul className="mt-2 rounded-xl border max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full min-h-[44px] text-left px-3 py-2 text-sm hover:opacity-90 touch-manipulation"
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
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl font-sans touch-manipulation"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <div className="min-w-0 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0 items-start">
                <input
                  ref={amountInputRef}
                  placeholder={ph}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={newForm.amount}
                  onChange={amountMoney.onChange}
                  onBlur={() => {
                    const n = parsePositiveMoneyAmount2Decimals(newForm.amount)
                    if (Number.isFinite(n)) onNewFormChange({ ...newForm, amount: formatMoneyInputFromNumber(n) })
                  }}
                  className="min-w-0 h-11 min-h-[44px] max-h-11 shrink-0 px-3 py-2 text-sm rounded-xl font-sans touch-manipulation"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
                <div className="flex min-w-0 flex-row items-center gap-2">
                  <label htmlFor={freqSelectId} className="sr-only">
                    Frekvens
                  </label>
                  <select
                    id={freqSelectId}
                    value={newForm.freq}
                    onChange={(e) =>
                      onNewFormChange({ ...newForm, freq: e.target.value as BudgetCategory['frequency'] })
                    }
                    className="h-11 min-h-[44px] max-h-11 min-w-0 flex-1 px-3 py-2 text-sm rounded-xl touch-manipulation"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="monthly">Månedlig</option>
                    <option value="quarterly">Kvartalsvis</option>
                    <option value="semiAnnual">Halvårlig</option>
                    <option value="yearly">Årlig</option>
                    <option value="weekly">Ukentlig</option>
                    <option value="once">Én gang</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setFreqHelpOpen((o) => !o)}
                    className="inline-flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-1 touch-manipulation"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Forklaring av frekvens"
                    aria-expanded={freqHelpOpen}
                    aria-controls={freqHelpPanelId}
                  >
                    <Info size={16} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
              {freqHelpOpen && (
                <div
                  id={freqHelpPanelId}
                  role="note"
                  className="rounded-lg border px-2.5 py-2 text-xs leading-snug break-words"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Månedlig, årlig (÷12) og ukentlig (omtrent månedlig nivå) fylles jevnt. Kvartalsvis settes
                  beløpet i jan/apr/jul/okt; halvårlig i jan og jul; én gang i én valgfri måned.
                </div>
              )}
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
                  className="w-full min-w-0 min-h-[44px] px-3 py-2 text-sm rounded-xl touch-manipulation"
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
            {showHouseholdSplitBlock && group && group !== 'inntekter' && profilesForHousehold.length >= 2 && (
              <HouseholdBudgetSplitSection
                profiles={profilesForHousehold}
                value={newForm.householdSplit}
                onChange={(hs) => onNewFormChange({ ...newForm, householdSplit: hs })}
              />
            )}

            {group === 'inntekter' && (
              <div
                className="rounded-xl px-3 py-3 space-y-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Inntekt i budsjettet
                </p>
                <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Beløpet du legger inn her er <strong>brutto</strong>. Når du huker av for trekk, vises det som{' '}
                  <strong>netto</strong> i budsjett-cellene (utbetaling); + ved linjen viser brutto, trekk og netto.
                </p>
                <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newForm.incomeWhApply}
                    onChange={(e) => onNewFormChange({ ...newForm, incomeWhApply: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded shrink-0"
                  />
                  <span className="text-sm leading-snug" style={{ color: 'var(--text)' }}>
                    Beløpet over er <strong>brutto</strong> — bruk forenklet trekk (ikke offisiell skatt)
                  </span>
                </label>
                {newForm.incomeWhApply && (
                  <label className="block">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Trekk (prosent)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={newForm.incomeWhPercent}
                      onChange={(e) =>
                        onNewFormChange({
                          ...newForm,
                          incomeWhPercent: e.target.value.replace(/[^\d.,]/g, ''),
                        })
                      }
                      className="mt-1 w-full min-h-[44px] px-3 py-2 text-sm rounded-xl touch-manipulation"
                      style={{
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  </label>
                )}
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
              className="w-full min-h-[44px] px-3 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-45 disabled:cursor-not-allowed touch-manipulation"
              style={{ background: 'var(--primary)' }}
            >
              Legg til egendefinert
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full min-h-[44px] text-sm rounded-xl touch-manipulation"
          style={{ color: 'var(--text-muted)' }}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
