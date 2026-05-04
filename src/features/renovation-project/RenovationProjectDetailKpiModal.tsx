'use client'

import { useMemo } from 'react'
import { X } from 'lucide-react'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { RenovationProject } from './types'
import type { ProjectKpis, RollupProjectKpis } from './kpis'
import RenovationModalFrame, { renovationModalFooterClass, renovationModalScrollableMainClass } from './RenovationModalFrame'

export type RenovationProjectDetailKpiKind = 'budgetSum' | 'actualSum' | 'variance' | 'checklist'

type Props = {
  open: boolean
  onClose: () => void
  kind: RenovationProjectDetailKpiKind | null
  project: RenovationProject
  kpis: ProjectKpis
  /** Sum på kort når underprosjekter tas med (detaljer i tabellen er kun dette prosjektet). */
  rollupHeadline?: RollupProjectKpis | null
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

export default function RenovationProjectDetailKpiModal({
  open,
  onClose,
  kind,
  project,
  kpis,
  rollupHeadline = null,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()

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
  const sumBudget = rollupHeadline ? rollupHeadline.totalBudgetedNok : kpis.totalBudgetedNok
  const sumActual = rollupHeadline ? rollupHeadline.totalActualNok : kpis.totalActualNok
  const sumVariance = rollupHeadline ? rollupHeadline.varianceNok : kpis.varianceNok
  const sumVariancePct = rollupHeadline ? rollupHeadline.variancePercentOfBudget : kpis.variancePercentOfBudget
  const chkDone = rollupHeadline ? rollupHeadline.checklistDone : kpis.checklistDone
  const chkTotal = rollupHeadline ? rollupHeadline.checklistTotal : kpis.checklistTotal
  const chkPct = rollupHeadline ? rollupHeadline.checklistPercent : kpis.checklistPercent

  const pctUsed = sumBudget > 0 ? ((sumActual / sumBudget) * 100).toFixed(1) : null

  return (
    <RenovationModalFrame onRequestClose={onClose} ariaLabelledBy={titleId} maxWidth="lg">
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-5 min-w-0"
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

        <div className={renovationModalScrollableMainClass}>
          {kind === 'budgetSum' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {rollupHeadline ? (
                  <>
                    Tallet som sum nederst inkluderer <strong style={{ color: 'var(--text)' }}>aktive underprosjekter</strong>.
                    Tabellen viser budsjettlinjer kun på <em>dette</em> nivået.
                  </>
                ) : (
                  <>
                    Summen av alle <strong style={{ color: 'var(--text)' }}>budsjettlinjer</strong> i dette prosjektet.
                  </>
                )}{' '}
                Gjenstående (aggregert): budsjettert minus faktisk ={' '}
                <strong style={{ color: 'var(--text)' }}>{formatNOK(sumBudget - sumActual)}</strong>.
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
                  {formatNOK(sumBudget)}
                </span>
              </div>
            </div>
          ) : null}

          {kind === 'actualSum' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {rollupHeadline ? (
                  <>
                    Sum faktisk nederst inkluderer <strong style={{ color: 'var(--text)' }}>aktive rom/underprosjekter</strong>.
                    Tabellen viser kun dette prosjektets budsjettlinjer.
                  </>
                ) : (
                  <>
                    Summen av alle <strong style={{ color: 'var(--text)' }}>utgifter</strong> registrert i prosjektet.
                  </>
                )}{' '}
                {pctUsed != null ? (
                  <>
                    Dette tilsvarer <strong style={{ color: 'var(--text)' }}>{pctUsed} %</strong> av budsjettert sum
                    {rollupHeadline ? ' (aggregert)' : ''}.
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
                  {formatNOK(sumActual)}
                </span>
              </div>
            </div>
          ) : null}

          {kind === 'variance' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Faktisk minus budsjettert</strong> per linje for dette prosjektet.
                {rollupHeadline ? (
                  <>
                    {' '}
                    <strong>Samlet avvik nederst</strong> inkluderer underprosjekter på kort — tabellen kun denne noden.
                  </>
                ) : (
                  ' Positivt tall betyr overforbruk på linjen eller totalt.'
                )}
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
                    style={{ color: sumVariance > 0 ? 'var(--danger)' : 'var(--success)' }}
                  >
                    {formatNOK(sumVariance)}
                  </span>
                </div>
                {sumVariancePct != null ? (
                  <div className="flex justify-between gap-2 text-xs pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avvik i % av budsjett</span>
                    <span style={{ color: 'var(--text-muted)' }}>{sumVariancePct.toFixed(1)} %</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {kind === 'checklist' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Punktene vises kun for denne noden. Avhuking er oversikt i oppussingsmodulen.
                {rollupHeadline ? (
                  <>
                    {' '}
                    Tall i feltet under følger <strong>sammendrag på kortet</strong> (hus og rom samlet).
                  </>
                ) : null}
              </p>
              {checklistSorted.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen punkter i sjekklisten.
                </p>
              ) : (
                <ul className="max-h-[min(45vh,40dvh,320px)] space-y-2 overflow-y-auto overscroll-y-contain touch-pan-y min-w-0 pr-1">
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
                  {chkTotal === 0 ? '—' : `${chkDone} / ${chkTotal}`}
                  {chkPct != null ? ` (${chkPct.toFixed(0)} %)` : ''}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className={`flex shrink-0 justify-end ${renovationModalFooterClass}`} style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ background: 'var(--primary)', color: 'white', WebkitTapHighlightColor: 'transparent' }}
          >
            Lukk
          </button>
        </div>
    </RenovationModalFrame>
  )
}
