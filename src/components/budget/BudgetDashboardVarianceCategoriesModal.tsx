'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatNokCurrencyDisplay } from '@/lib/money/nokDisplayFormat'
import { useStore } from '@/lib/store'
import { X } from 'lucide-react'

function signedNOK(n: number): string {
  const show = useStore.getState().showAmountDecimals
  const abs = formatNokCurrencyDisplay(Math.abs(n), show)
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

function isBadVariance(r: BudgetVsActualRow): boolean {
  if (r.type === 'income') return r.variance < 0
  return r.variance > 0
}

type Props = {
  open: boolean
  onClose: () => void
  periodLabel: string
  rows: BudgetVsActualRow[]
  linkHrefForCategory: (name: string) => string
}

export default function BudgetDashboardVarianceCategoriesModal({
  open,
  onClose,
  periodLabel,
  rows,
  linkHrefForCategory,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const badRows = useMemo(() => {
    const list = rows.filter(isBadVariance)
    list.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    return list
  }, [rows])

  if (!open) return null

  const titleId = 'budget-dashboard-variance-cats-modal-title'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90vh,800px)] w-full max-w-lg flex-col rounded-2xl shadow-2xl md:max-w-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              Kategorier med avvik
            </h2>
            <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
              {periodLabel} · Utgift over budsjett eller inntekt under budsjett
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          {badRows.length === 0 ? (
            <p className="text-[14px] leading-relaxed py-2" style={{ color: 'var(--text-muted)' }}>
              Ingen avvik i perioden — alle linjer er innenfor eller bedre enn budsjett.
            </p>
          ) : (
            <div className="rounded-xl overflow-x-auto overflow-y-visible" style={{ background: 'var(--bg)' }}>
              <div
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,4rem)_repeat(3,minmax(0,4.25rem))] gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.04em]"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
              >
                <span className="min-w-0">Kategori</span>
                <span>Type</span>
                <span className="text-right tabular-nums">Budsj.</span>
                <span className="text-right tabular-nums">Fakt.</span>
                <span className="text-right tabular-nums">Avvik</span>
              </div>
              {badRows.map((r) => {
                const href = linkHrefForCategory(r.name)
                const typeLabel = r.type === 'income' ? 'Inn.' : 'Utg.'
                return (
                  <Link
                    key={r.categoryId}
                    href={href}
                    onClick={onClose}
                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,4rem)_repeat(3,minmax(0,4.25rem))] gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-3 text-[13px] sm:text-[14px] border-b border-[var(--border)] last:border-b-0 items-baseline min-h-[44px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] touch-manipulation"
                    style={{ color: 'var(--text)' }}
                  >
                    <span className="font-medium truncate min-w-0" title={r.name}>
                      {r.name}
                    </span>
                    <span className="text-[12px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {typeLabel}
                    </span>
                    <span className="text-right tabular-nums text-[13px]">{formatNOK(r.budgeted)}</span>
                    <span className="text-right tabular-nums text-[13px]">{formatNOK(r.actual)}</span>
                    <span className="text-right tabular-nums text-[13px] font-medium" style={{ color: 'var(--danger)' }}>
                      {signedNOK(r.variance)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 rounded-xl text-[15px] font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
