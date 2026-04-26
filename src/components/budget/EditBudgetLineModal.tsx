'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { BudgetCategory } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { X, Pencil } from 'lucide-react'
import type { CategoryRemapErrorReason } from '@/lib/categoryRemap'
import { remapErrorNb, willMergeWithExistingLineInParent } from '@/lib/categoryRemapMessages'
import { BUDGET_MONTH_LABELS_NB } from '@/lib/utils'
import { getOnceLineDisplayMonthIndex } from '@/lib/budget/applyOnceMonthIndexChange'

type RemapResult = { ok: true } | { ok: false; reason: CategoryRemapErrorReason }

type Props = {
  open: boolean
  onClose: () => void
  category: BudgetCategory | null
  parent: ParentCategory
  groupLabel: string
  /** Standard + egne etiketter for denne hovedgruppen (f.eks. fra `getAvailableLabels`), unntatt nåværende navn. */
  availableLabels: string[]
  /** Alle budsjettlinjer (for sammenslåingskontroll). */
  budgetCategories: BudgetCategory[]
  /** Etiketter fra koblede abo med `syncToBudget` til denne linjen (tom = ingen advarsel). */
  linkedServiceSubscriptionLabels: string[]
  remapBudgetCategoryName: (parent: ParentCategory, fromName: string, toName: string) => RemapResult
  /** Når satt: navneendring oppdateres hos alle deltakere (felles husholdningslinje). */
  sharedGroupId?: string | null
  remapSharedHouseholdBudgetLineName?: (
    groupId: string,
    parent: ParentCategory,
    toName: string,
  ) => RemapResult
  /** Valgfri: inntektslinje – åpner eksisterende trekk-modal. */
  onOpenIncomeWithholding?: () => void
  /** Engang + ikke abo-låst rad: bruker kan velge måned. */
  allowOnceMonthEdit?: boolean
  /** Brukes i tilgjengelig/ledetekst, f.eks. engang i budsjettåret. */
  viewingYear?: number
  /** Kalles når bruker lagrer (etter vellykket navnemap om aktuelt) med ny måned for engang. */
  onApplyOnceMonth?: (newMonthIndex: number) => void
}

export default function EditBudgetLineModal({
  open,
  onClose,
  category,
  parent,
  groupLabel,
  availableLabels,
  budgetCategories,
  linkedServiceSubscriptionLabels,
  remapBudgetCategoryName,
  sharedGroupId = null,
  remapSharedHouseholdBudgetLineName,
  onOpenIncomeWithholding,
  allowOnceMonthEdit = false,
  viewingYear,
  onApplyOnceMonth,
}: Props) {
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [onceMonthIndexDraft, setOnceMonthIndexDraft] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const customNameInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableLabels.slice(0, 8)
    return availableLabels.filter((a) => a.toLowerCase().includes(q)).slice(0, 12)
  }, [availableLabels, search])

  const incomeWithholdingLink = useMemo(
    () => Boolean(
      onOpenIncomeWithholding && category && parent === 'inntekter' && category.type === 'income',
    ),
    [onOpenIncomeWithholding, category, parent],
  )

  useEffect(() => {
    if (!open || !category) return
    setName(category.name)
    setSearch('')
    setError(null)
    setMergeMode(false)
    if (category.frequency === 'once') {
      setOnceMonthIndexDraft(getOnceLineDisplayMonthIndex(category))
    } else {
      setOnceMonthIndexDraft(0)
    }
  }, [open, category])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [open, category?.id])

  const backdropDismiss = useModalBackdropDismiss(onClose)

  if (!open || !category) return null

  const fromName = category.name
  const trimmed = name.trim()
  const wouldMerge =
    trimmed &&
    fromName !== trimmed &&
    willMergeWithExistingLineInParent(budgetCategories, parent, category.id, trimmed)

  const applyOnceIfNeeded = () => {
    if (!allowOnceMonthEdit || !onApplyOnceMonth || category.frequency !== 'once') return
    if (getOnceLineDisplayMonthIndex(category) === onceMonthIndexDraft) return
    onApplyOnceMonth(onceMonthIndexDraft)
  }

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault()
    setError(null)

    if (trimmed === fromName) {
      applyOnceIfNeeded()
      onClose()
      return
    }
    if (!trimmed) {
      setError(remapErrorNb('empty_name'))
      return
    }

    if (sharedGroupId && wouldMerge) {
      setError(
        'Felles husholdningslinje kan ikke sammenslås med en annen linje her. Bruk et annet unikt navn, eller endre fordeling fra budsjettet.',
      )
      return
    }

    if (wouldMerge && !mergeMode) {
      setMergeMode(true)
      return
    }

    if (sharedGroupId && remapSharedHouseholdBudgetLineName) {
      const res = remapSharedHouseholdBudgetLineName(sharedGroupId, parent, trimmed)
      if (!res.ok) {
        setError(remapErrorNb(res.reason))
        setMergeMode(false)
        return
      }
      applyOnceIfNeeded()
      onClose()
      return
    }

    const res = remapBudgetCategoryName(parent, fromName, trimmed)
    if (!res.ok) {
      setError(remapErrorNb(res.reason))
      setMergeMode(false)
      return
    }
    applyOnceIfNeeded()
    onClose()
  }

  const otherLineName = wouldMerge
    ? budgetCategories.find(
        (c) => c.parentCategory === parent && c.name === trimmed && c.id !== category.id,
      )?.name ?? trimmed
    : null

  const pickSuggestion = (picked: string) => {
    const t = picked.trim()
    if (!t) return
    setName(t)
    setSearch('')
    setError(null)
    setMergeMode(false)
    requestAnimationFrame(() => customNameInputRef.current?.focus())
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      {...backdropDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-budget-line-title"
    >
      <div
        className="w-full max-w-md min-w-0 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-x-hidden overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4 min-w-0">
          <h3
            id="edit-budget-line-title"
            className="font-semibold text-lg min-w-0 pr-2 flex items-center gap-2"
            style={{ color: 'var(--text)' }}
          >
            <Pencil size={20} className="shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
            <span>
              Rediger linje · {groupLabel}
            </span>
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

        {sharedGroupId && (
          <p className="text-sm rounded-xl p-3 mb-4" style={{ background: 'var(--primary-pale)', color: 'var(--text)' }}>
            Denne linjen er <strong>fordelt i husholdningen</strong>. Når du lagrer et nytt navn, oppdateres det hos
            alle valgte personer.{' '}
            {allowOnceMonthEdit ? (
              <>
                Beløp og forhold mellom personer justeres fortsatt i tabellen. For engangslinjer kan du her flytte hvilken
                måned engangsposten ligger i.
              </>
            ) : (
              <>Beløp og fordeling endres fra budsjettvisningen (ikke her).</>
            )}
          </p>
        )}

        {linkedServiceSubscriptionLabels.length > 0 && (
          <p className="text-sm rounded-xl p-3 mb-4" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            {linkedServiceSubscriptionLabels.join(', ')} — planbeløp styres fra Abonnementer. Du kan fortsatt endre
            navn på linjen.
          </p>
        )}

        {incomeWithholdingLink && onOpenIncomeWithholding && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Forenklet trekk: bruk knappen for trekk i budsjettet, eller{' '}
            <button
              type="button"
              className="font-medium underline"
              style={{ color: 'var(--primary)' }}
              onClick={() => {
                onOpenIncomeWithholding()
                onClose()
              }}
            >
              åpne trekk her
            </button>
            .
          </p>
        )}

        {mergeMode && otherLineName && (
          <div
            className="rounded-xl p-4 mb-4 space-y-2"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
            role="status"
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Sammenslåing
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              «{fromName}» slås sammen med den eksisterende linjen «{otherLineName}» i {groupLabel}. Budsjetter
              adderes; transaksjoner i «{fromName}» får kategorinavn «{otherLineName}».
            </p>
            <button
              type="button"
              className="text-sm font-medium mt-1"
              style={{ color: 'var(--primary)' }}
              onClick={() => {
                setMergeMode(false)
                setError(null)
              }}
            >
              Tilbake
            </button>
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Søk blant forslag, eller skriv eget kategorinavn under. Lagre når du er ferdig.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <label htmlFor="edit-budget-line-search" className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Søk i forslag
            </label>
            <input
              id="edit-budget-line-search"
              ref={searchInputRef}
              type="search"
              placeholder="Søk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mt-1 min-h-[44px] px-3 py-2 text-sm rounded-xl font-sans touch-manipulation"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              autoComplete="off"
            />
          </div>

          {filtered.length > 0 && (
            <ul className="rounded-xl border max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {filtered.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    className="w-full min-h-[44px] text-left px-3 py-2 text-sm hover:opacity-90 touch-manipulation"
                    style={{ background: 'transparent', color: 'var(--text)' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Eget kategorinavn
            </p>
            <input
              id="edit-budget-line-name"
              ref={customNameInputRef}
              type="text"
              placeholder="Skriv navn (egendefinert)"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
                setMergeMode(false)
              }}
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl font-sans touch-manipulation"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              autoComplete="off"
            />
          </div>

          {allowOnceMonthEdit && category.frequency === 'once' && (
            <div className="flex flex-col gap-1 min-w-0">
              <label
                htmlFor="edit-budget-line-once-month"
                className="text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Hvilken måned?{viewingYear != null ? ` (budsjettår ${viewingYear})` : ''}
              </label>
              <select
                id="edit-budget-line-once-month"
                value={onceMonthIndexDraft}
                onChange={(e) => setOnceMonthIndexDraft(Number(e.target.value))}
                className="w-full min-w-0 min-h-[44px] px-3 py-2 text-sm rounded-xl font-sans touch-manipulation"
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

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger, #C92A2A)' }} role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl text-sm font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl text-sm font-medium"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              {mergeMode ? 'Bekreft sammenslåing' : 'Lagre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
