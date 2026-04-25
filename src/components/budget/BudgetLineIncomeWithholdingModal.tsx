'use client'

import { useEffect, useState } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { BudgetCategory } from '@/lib/store'
import {
  budgetCategoryUsesIncomeWithholding,
  effectiveBudgetedIncomeMonth,
  normalizeIncomeWithholdingRule,
  withholdingPercentForBudgetCategory,
} from '@/lib/incomeWithholding'
import { formatNOK } from '@/lib/utils'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  category: BudgetCategory | null
  previewMonthIndex: number
  monthLabel: string
  onClose: () => void
  onSave: (categoryId: string, rule: { apply: boolean; percent: number }) => void
}

export default function BudgetLineIncomeWithholdingModal({
  open,
  category,
  previewMonthIndex,
  monthLabel,
  onClose,
  onSave,
}: Props) {
  const [apply, setApply] = useState(false)
  const [percentStr, setPercentStr] = useState('32')

  useEffect(() => {
    if (!open || !category) return
    const r = normalizeIncomeWithholdingRule(category.incomeWithholding)
    setApply(r.apply)
    setPercentStr(r.apply && r.percent > 0 ? String(r.percent) : r.apply ? String(r.percent) : '32')
  }, [open, category])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const backdropDismiss = useModalBackdropDismiss(onClose)

  if (!open || !category) return null

  const rawMonth =
    Array.isArray(category.budgeted) &&
    typeof category.budgeted[previewMonthIndex] === 'number' &&
    Number.isFinite(category.budgeted[previewMonthIndex]!)
      ? Math.max(0, category.budgeted[previewMonthIndex]!)
      : 0

  const draftRule = normalizeIncomeWithholdingRule({
    apply,
    percent: Number(String(percentStr).replace(',', '.')) || 0,
  })
  const catDraft: BudgetCategory = {
    ...category,
    incomeWithholding: draftRule.apply ? { apply: true, percent: draftRule.percent } : undefined,
  }
  const previewNet = effectiveBudgetedIncomeMonth(catDraft, previewMonthIndex)

  const handleSave = () => {
    const r = normalizeIncomeWithholdingRule({
      apply,
      percent: Number(String(percentStr).replace(',', '.')) || 0,
    })
    onSave(category.id, r)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      {...backdropDismiss}
      role="presentation"
    >
      <div
        className="w-full max-w-md min-w-0 rounded-t-2xl sm:rounded-2xl p-6 pt-5 shadow-xl max-h-[90vh] overflow-x-hidden overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wh-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 id="wh-title" className="font-semibold text-lg min-w-0" style={{ color: 'var(--text)' }}>
            Forenklet trekk · {category.name}
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
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          Valgfritt: la det <strong>lagrede</strong> budsjettbeløpet være <strong>brutto</strong>, og trekk en forenklet
          prosentsats. <strong>I budsjett-tabellen vises månedstall som netto</strong> (utbetaling) når trekk er på —
          trykk + ved linjen for å se brutto, trekk og netto. Summeringer og rapporter følger samme netto. Dette
          erstatter ikke offisiell skatt.
        </p>
        <label className="flex items-start gap-3 min-h-[44px] cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={apply}
            onChange={(e) => setApply(e.target.checked)}
            className="mt-1 h-4 w-4 rounded shrink-0"
          />
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            Beløp i budsjettet er brutto — bruk forenklet trekk
          </span>
        </label>
        {apply && (
          <label className="block mb-4">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Trekk (prosent)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={percentStr}
              onChange={(e) => setPercentStr(e.target.value.replace(/[^\d.,]/g, ''))}
              className="mt-1 w-full min-h-[44px] px-3 py-2 rounded-xl text-sm touch-manipulation"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </label>
        )}
        <div
          className="rounded-xl px-3 py-3 text-sm space-y-1 mb-4"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>Forhåndsvisning ({monthLabel})</p>
          <p style={{ color: 'var(--text)' }}>
            Brutto (lagret): <span className="tabular-nums font-medium">{formatNOK(rawMonth)}</span>
          </p>
          {apply && draftRule.percent > 0 ? (
            <>
              <p style={{ color: 'var(--text)' }}>
                Trekk ca. {draftRule.percent} %:{' '}
                <span className="tabular-nums font-medium">{formatNOK(rawMonth - previewNet)}</span>
              </p>
              <p style={{ color: 'var(--text)' }}>
                Netto i beregninger:{' '}
                <span className="tabular-nums font-medium" style={{ color: 'var(--primary)' }}>
                  {formatNOK(previewNet)}
                </span>
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              Summeringer bruker beløpet du legger inn uten ekstra trekk (Modus A).
            </p>
          )}
        </div>
        {budgetCategoryUsesIncomeWithholding(category) && !apply && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Nåværende sats: {withholdingPercentForBudgetCategory(category)} % (fjernes ved lagring uten avkrysning).
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-white w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Lagre
          </button>
        </div>
      </div>
    </div>
  )
}
