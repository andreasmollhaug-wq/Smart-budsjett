'use client'

import Link from 'next/link'
import { formatNOK } from '@/lib/utils'
import type { BudgetSetupChecklistItem } from '@/lib/budgetSetupChecklist'

type Props = {
  open: boolean
  item: BudgetSetupChecklistItem | null
  overridden: boolean
  onClose: () => void
  onToggleOverride: (next: boolean) => void
}

export default function BudgetSetupChecklistDetailModal({
  open,
  item,
  overridden,
  onClose,
  onToggleOverride,
}: Props) {
  if (!open || !item) return null

  const whyHeading = item.done ? 'Hvorfor dette er ferdig' : 'Hva som gjenstår'

  let whyBody = ''
  if (item.statusKind === 'auto') {
    whyBody = `Du har lagt inn nok linjer med beløp i «${item.title}» til at vi kan huke av automatisk.`
  } else if (item.statusKind === 'override') {
    whyBody = `Du har markert «${item.title}» som ferdig manuelt. Systemet ville fortsatt ønsket flere linjer med beløp for full automatisk check.`
  } else {
    whyBody = item.message
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default z-0"
        aria-label="Lukk"
        onPointerDown={onClose}
        style={{ border: 'none', background: 'transparent' }}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto touch-manipulation"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <h2 id="checklist-detail-title" className="text-lg font-semibold min-w-0" style={{ color: 'var(--text)' }}>
            {item.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Lukk
          </button>
        </div>

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {whyHeading}
          </h3>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {whyBody}
          </p>
          {!item.done && item.threshold > 0 && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              For automatisk avhuking forventes minst {item.threshold} linje{item.threshold === 1 ? '' : 'r'} med beløp i
              denne gruppen.
            </p>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Det du har lagt inn
          </h3>
          {item.lines.length === 0 ? (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Ingen linjer i denne gruppen ennå. Legg til under Budsjett.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {item.lines.map((line) => (
                <li
                  key={line.name}
                  className="flex items-baseline justify-between gap-3 text-sm min-w-0"
                  style={{ color: 'var(--text)' }}
                >
                  <span className="truncate min-w-0">{line.name}</span>
                  <span className="shrink-0 tabular-nums font-medium">{formatNOK(line.yearTotal)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {item.done && item.statusKind === 'auto' ? (
            <p className="text-sm w-full sm:flex-1 min-w-0" style={{ color: 'var(--text-muted)' }}>
              Du trenger ikke markere manuelt — dette er allerede fullført automatisk.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onToggleOverride(!overridden)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto"
              style={{
                background: overridden ? 'transparent' : 'var(--primary-pale)',
                border: '1px solid var(--border)',
                color: overridden ? 'var(--text-muted)' : 'var(--primary)',
              }}
            >
              {overridden ? 'Fjern ferdig-markering' : 'Marker som ferdig (uten full auto-check)'}
            </button>
          )}
          <Link
            href={item.ctaHref}
            className="inline-flex min-h-[44px] items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white text-center w-full sm:w-auto sm:shrink-0"
            style={{ background: 'var(--primary)' }}
            onClick={onClose}
          >
            Gå til budsjett
          </Link>
        </div>
      </div>
    </div>
  )
}
