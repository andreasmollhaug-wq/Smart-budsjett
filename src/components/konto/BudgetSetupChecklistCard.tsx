'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronDown, ChevronRight, Circle } from 'lucide-react'
import type { BudgetCategory } from '@/lib/store'
import { useStore } from '@/lib/store'
import { buildBudgetSetupChecklist, type BudgetSetupChecklistItem } from '@/lib/budgetSetupChecklist'
import BudgetSetupChecklistDetailModal from '@/components/konto/BudgetSetupChecklistDetailModal'

type Props = {
  budgetCategories: BudgetCategory[]
  budgetYear: number
}

export default function BudgetSetupChecklistCard({ budgetCategories, budgetYear }: Props) {
  const overridesByYear = useStore((s) => {
    const o = s.people[s.activeProfileId]?.budgetSetupOverridesByYear
    return o
  })
  const setBudgetSetupOverride = useStore((s) => s.setBudgetSetupOverride)

  const [modalItem, setModalItem] = useState<BudgetSetupChecklistItem | null>(null)
  /** Punktene (Inntekter, Regninger, …) er skjult til brukeren åpner med pila under oppsummeringen. */
  const [checklistDetailsOpen, setChecklistDetailsOpen] = useState(false)

  const items = useMemo(() => {
    return buildBudgetSetupChecklist({
      budgetCategories,
      budgetYear,
      overridesByYear: overridesByYear ?? undefined,
    })
  }, [budgetCategories, budgetYear, overridesByYear])

  const doneCount = items.filter((i) => i.done).length
  const total = items.length
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const y = String(Math.floor(budgetYear))
  const overridesForYear = overridesByYear?.[y] ?? {}

  return (
    <>
      <section
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        aria-label="Sjekkliste for budsjett-oppsett"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-base sm:text-lg" style={{ color: 'var(--text)' }}>
              Budsjett-oppsett
            </h2>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Vi haker av når du har nok linjer med beløp. Bruk pila under fremdriften for å vise punktene; trykk på et
              punkt for full oversikt.
            </p>
          </div>
          <Link
            href="/budsjett"
            className="shrink-0 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium min-h-[44px] w-full sm:w-auto touch-manipulation"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Åpne budsjett
          </Link>
        </div>

        <div className="mt-5 min-w-0">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {doneCount} av {total} fullført
            </span>
            <span className="tabular-nums text-xs" style={{ color: 'var(--text-muted)' }}>
              {progressPct}%
            </span>
          </div>
          <div
            className="mt-2 h-2 rounded-full overflow-hidden min-w-0"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%`, background: 'var(--primary)' }}
            />
          </div>

          <button
            type="button"
            id="checklist-details-toggle"
            className="mt-4 flex w-full items-center justify-between gap-3 min-h-[44px] rounded-xl px-3 py-2.5 text-left touch-manipulation transition-colors"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            aria-expanded={checklistDetailsOpen}
            aria-controls="checklist-details-list"
            onClick={() => setChecklistDetailsOpen((o) => !o)}
          >
            <span className="text-sm font-medium min-w-0">
              {checklistDetailsOpen ? 'Skjul punktene' : 'Vis inntekter, regninger, utgifter …'}
            </span>
            <ChevronDown
              size={22}
              className="shrink-0 transition-transform duration-200 motion-reduce:transition-none"
              style={{
                color: 'var(--primary)',
                transform: checklistDetailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              aria-hidden
            />
          </button>
        </div>

        <ul id="checklist-details-list" className="mt-3 space-y-2" hidden={!checklistDetailsOpen}>
          {items.map((it) => {
            const checked = it.done
            const preview =
              it.countWithAmount > 0
                ? `${it.countWithAmount} linje${it.countWithAmount === 1 ? '' : 'r'} med beløp`
                : 'Ingen linjer med beløp ennå'
            const previewSuffix = it.statusKind === 'override' ? ' · Markert som ferdig' : ''

            return (
              <li
                key={it.id}
                className="min-w-0 rounded-xl"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 min-w-0 py-3 px-3 text-left rounded-xl touch-manipulation"
                  onClick={() => setModalItem(it)}
                  aria-label={`Detaljer for ${it.title}`}
                >
                  <div className="shrink-0 mt-0.5" aria-hidden>
                    {checked ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
                    ) : (
                      <Circle size={20} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {it.title}
                    </p>
                    <p className="text-xs mt-0.5 leading-snug truncate" style={{ color: 'var(--text-muted)' }}>
                      {preview}
                      {previewSuffix}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 opacity-50" style={{ color: 'var(--text-muted)' }} aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <BudgetSetupChecklistDetailModal
        open={modalItem !== null}
        item={modalItem}
        overridden={modalItem ? overridesForYear[modalItem.id] === true : false}
        onClose={() => setModalItem(null)}
        onToggleOverride={(next) => {
          if (!modalItem) return
          setBudgetSetupOverride(budgetYear, modalItem.id, next)
        }}
      />
    </>
  )
}
