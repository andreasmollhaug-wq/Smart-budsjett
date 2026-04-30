'use client'

import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { RenovationProject } from './types'
import type { ProjectKpis } from './kpis'

export type RenovationProjectDetailKpiKind = 'budgetSum' | 'actualSum' | 'variance' | 'checklist'

type Props = {
  open: boolean
  onClose: () => void
  kind: RenovationProjectDetailKpiKind | null
  project: RenovationProject
  kpis: ProjectKpis
}

const TITLE_IDS: Record<RenovationProjectDetailKpiKind, string> = {
  budgetSum: 'renovation-detail-kpi-budget',
  actualSum: 'renovation-detail-kpi-actual',
  variance: 'renovation-detail-kpi-variance',
  checklist: 'renovation-detail-kpi-checklist',
}

const LABELS: Record<RenovationProjectDetailKpiKind, string> = {
  budgetSum: 'Budsjett (sum)',
  actualSum: 'Faktisk (sum)',
  variance: 'Avvik',
  checklist: 'Sjekkliste',
}

export default function RenovationProjectDetailKpiModal({ open, onClose, kind, project, kpis }: Props) {
  const { formatNOK } = useNokDisplayFormatters()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const lineRowsSorted = useMemo(
    () => [...kpis.lineRows].sort((a, b) => b.budgetedNok - a.budgetedNok),
    [kpis.lineRows],
  )

  const checklistSorted = useMemo(
    () => [...project.checklist].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label)),
    [project.checklist],
  )

  if (!open || kind === null) return null

  const titleId = TITLE_IDS[kind]
  const pctUsed =
    kpis.totalBudgetedNok > 0 ? ((kpis.totalActualNok / kpis.totalBudgetedNok) * 100).toFixed(1) : null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className="absolute inset-0 bg-black/40 touch-manipulation" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-xl min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b p-5 min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id={titleId} className="text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              {LABELS[kind]}
            </h2>
            <p className="text-xs leading-snug sm:text-sm truncate" style={{ color: 'var(--text-muted)' }} title={project.name}>
              {project.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
            aria-label="Lukk"
          >
            <X size={22} style={{ color: 'var(--text-muted)' }} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 min-w-0">
          {kind === 'budgetSum' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summen av alle <strong style={{ color: 'var(--text)' }}>budsjettlinjer</strong> i dette prosjektet.
                Gjenstående: budsjettert minus faktisk ={' '}
                <strong style={{ color: 'var(--text)' }}>
                  {formatNOK(kpis.totalBudgetedNok - kpis.totalActualNok)}
                </strong>
                .
              </p>
              {lineRowsSorted.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen budsjettlinjer — legg til linjer under budsjettseksjonen.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border min-w-0" style={{ borderColor: 'var(--border)' }}>
                  <table className="w-full text-sm min-w-[240px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                          Linje
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          Budsjett
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineRowsSorted.map((row) => (
                        <tr key={row.lineId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-3 py-2 min-w-0 max-w-[14rem] break-words" style={{ color: 'var(--text)' }}>
                            {row.label}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {formatNOK(row.budgetedNok)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div
                className="rounded-xl border p-4 flex flex-wrap justify-between gap-2 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Sum</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {formatNOK(kpis.totalBudgetedNok)}
                </span>
              </div>
            </div>
          ) : null}

          {kind === 'actualSum' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summen av alle <strong style={{ color: 'var(--text)' }}>utgifter</strong> registrert i prosjektet.
                {pctUsed != null ? (
                  <>
                    {' '}
                    Dette tilsvarer <strong style={{ color: 'var(--text)' }}>{pctUsed} %</strong> av budsjettert sum.
                  </>
                ) : null}
              </p>
              {kpis.uncategorizedActualNok > 0 ? (
                <p className="text-sm rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>Ukategoriserte utgifter:</strong>{' '}
                  {formatNOK(kpis.uncategorizedActualNok)} — ikke knyttet til en budsjettlinje.
                </p>
              ) : null}
              <div className="overflow-x-auto rounded-xl border min-w-0" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm min-w-[260px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                        Linje
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        Faktisk
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineRowsSorted.map((row) => (
                      <tr key={row.lineId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 min-w-0 max-w-[14rem] break-words" style={{ color: 'var(--text)' }}>
                          {row.label}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(row.actualNok)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="rounded-xl border p-4 flex flex-wrap justify-between gap-2 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Sum faktisk</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {formatNOK(kpis.totalActualNok)}
                </span>
              </div>
            </div>
          ) : null}

          {kind === 'variance' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Faktisk minus budsjettert</strong> per linje og samlet.
                Positivt tall betyr overforbruk på linjen eller totalt.
              </p>
              <div className="overflow-x-auto rounded-xl border min-w-0" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                        Linje
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        Avvik
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        % av linje
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineRowsSorted.map((row) => (
                      <tr key={row.lineId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 min-w-0 max-w-[10rem] break-words" style={{ color: 'var(--text)' }}>
                          {row.label}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums font-medium"
                          style={{ color: row.varianceNok > 0 ? 'var(--danger)' : 'var(--text)' }}
                        >
                          {formatNOK(row.varianceNok)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {row.variancePercentOfLine != null ? `${row.variancePercentOfLine.toFixed(1)} %` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="rounded-xl border p-4 space-y-2 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <div className="flex justify-between gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Samlet avvik</span>
                  <span
                    className="font-semibold"
                    style={{ color: kpis.varianceNok > 0 ? 'var(--danger)' : 'var(--success)' }}
                  >
                    {formatNOK(kpis.varianceNok)}
                  </span>
                </div>
                {kpis.variancePercentOfBudget != null ? (
                  <div className="flex justify-between gap-2 text-xs pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avvik i % av budsjett</span>
                    <span style={{ color: 'var(--text-muted)' }}>{kpis.variancePercentOfBudget.toFixed(1)} %</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {kind === 'checklist' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Punktene kommer fra mal eller egendefinert liste. Avhuking er kun oversikt i prosjektmodulen.
              </p>
              {checklistSorted.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen punkter i sjekklisten.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[40vh] overflow-y-auto min-w-0 pr-1">
                  {checklistSorted.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-xl border px-3 py-2 text-sm min-w-0"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--bg)',
                        opacity: item.done ? 0.85 : 1,
                      }}
                    >
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold"
                        style={{
                          borderColor: 'var(--border)',
                          background: item.done ? 'var(--primary)' : 'transparent',
                          color: item.done ? 'white' : 'transparent',
                        }}
                        aria-hidden
                      >
                        {item.done ? '✓' : ''}
                      </span>
                      <span
                        className="min-w-0 flex-1 leading-snug break-words"
                        style={{
                          color: 'var(--text)',
                          textDecoration: item.done ? 'line-through' : undefined,
                        }}
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div
                className="rounded-xl border p-4 flex flex-wrap justify-between gap-2 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Fremdrift</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {kpis.checklistTotal === 0 ? '—' : `${kpis.checklistDone} / ${kpis.checklistTotal}`}
                  {kpis.checklistPercent != null ? ` (${kpis.checklistPercent.toFixed(0)} %)` : ''}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t p-4 sm:p-5" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
