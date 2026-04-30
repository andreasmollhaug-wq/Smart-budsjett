'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import type { RenovationProject } from './types'
import { computeProjectKpis, type PortfolioKpis } from './kpis'
import { RENOVATION_PROJECT_BASE_PATH } from './paths'

export type RenovationPortfolioKpiKind = 'activeProjects' | 'totalBudget' | 'totalActual' | 'checklist'

type Props = {
  open: boolean
  onClose: () => void
  kind: RenovationPortfolioKpiKind | null
  portfolio: PortfolioKpis
  activeProjects: RenovationProject[]
}

const TITLE_IDS: Record<RenovationPortfolioKpiKind, string> = {
  activeProjects: 'renovation-portfolio-kpi-active',
  totalBudget: 'renovation-portfolio-kpi-budget',
  totalActual: 'renovation-portfolio-kpi-actual',
  checklist: 'renovation-portfolio-kpi-checklist',
}

const LABELS: Record<RenovationPortfolioKpiKind, string> = {
  activeProjects: 'Aktive prosjekter',
  totalBudget: 'Samlet budsjett',
  totalActual: 'Samlet faktisk',
  checklist: 'Sjekkliste (samlet)',
}

export default function RenovationPortfolioKpiModal({ open, onClose, kind, portfolio, activeProjects }: Props) {
  const { formatNOK } = useNokDisplayFormatters()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const rows = useMemo(() => {
    return activeProjects.map((p) => ({
      project: p,
      k: computeProjectKpis(p),
    }))
  }, [activeProjects])

  const sortedByBudget = useMemo(() => [...rows].sort((a, b) => b.k.totalBudgetedNok - a.k.totalBudgetedNok), [rows])
  const sortedByActual = useMemo(() => [...rows].sort((a, b) => b.k.totalActualNok - a.k.totalActualNok), [rows])

  if (!open || kind === null) return null

  const titleId = TITLE_IDS[kind]

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
            <p className="text-xs leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Alle aktive prosjekter — ikke synkronisert med hovedbudsjettet
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
          {kind === 'activeProjects' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>{portfolio.activeProjectCount}</strong> prosjekt
                {portfolio.activeProjectCount !== 1 ? 'er' : ''} med status aktiv. Arkiverte prosjekter telles ikke i
                KPI-ene på denne siden.
              </p>
              {rows.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen aktive prosjekter — opprett et nytt for å komme i gang.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rows.map(({ project, k }) => (
                    <li key={project.id}>
                      <Link
                        href={`${RENOVATION_PROJECT_BASE_PATH}/${project.id}`}
                        onClick={onClose}
                        className="flex min-h-[44px] flex-col justify-center rounded-xl border px-3 py-2 text-left transition-opacity hover:opacity-90 touch-manipulation min-w-0"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                      >
                        <span className="font-medium truncate" style={{ color: 'var(--text)' }}>
                          {project.name}
                        </span>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          Budsjett {formatNOK(k.totalBudgetedNok)} · Faktisk {formatNOK(k.totalActualNok)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {kind === 'totalBudget' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summen er alle <strong style={{ color: 'var(--text)' }}>budsjettlinjer</strong> i aktive prosjekter.
                Gjenstående på tvers av prosjektene er budsjettert minus faktisk:{' '}
                <strong style={{ color: 'var(--text)' }}>{formatNOK(portfolio.remainingNok)}</strong>
                {portfolio.remainingNok < 0 ? ' (negativ betyr samlet overforbruk).' : '.'}
              </p>
              <div className="overflow-x-auto rounded-xl border min-w-0" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm min-w-[260px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                        Prosjekt
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        Budsjett
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByBudget.map(({ project, k }) => (
                      <tr key={project.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 min-w-0 max-w-[12rem] truncate" style={{ color: 'var(--text)' }} title={project.name}>
                          {project.name}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(k.totalBudgetedNok)}
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
                <span style={{ color: 'var(--text-muted)' }}>Sum budsjett</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {formatNOK(portfolio.totalBudgetedNok)}
                </span>
              </div>
            </div>
          ) : null}

          {kind === 'totalActual' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summen er alle <strong style={{ color: 'var(--text)' }}>registrerte utgifter</strong> i aktive
                prosjekter. Andel av samlet budsjett brukt:{' '}
                {portfolio.budgetUtilizationPercent != null ? (
                  <strong style={{ color: 'var(--text)' }}>{portfolio.budgetUtilizationPercent.toFixed(1)} %</strong>
                ) : (
                  '— (ingen budsjettlinjer)'
                )}
                .
              </p>
              <div className="overflow-x-auto rounded-xl border min-w-0" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm min-w-[280px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                        Prosjekt
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        Faktisk
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByActual.map(({ project, k }) => (
                      <tr key={project.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2 min-w-0 max-w-[12rem] truncate" style={{ color: 'var(--text)' }} title={project.name}>
                          {project.name}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(k.totalActualNok)}
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
                  {formatNOK(portfolio.totalActualNok)}
                </span>
              </div>
              {portfolio.varianceNok !== 0 && (
                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Samlet avvik (faktisk − budsjett):{' '}
                  <strong style={{ color: portfolio.varianceNok > 0 ? 'var(--danger)' : 'var(--text)' }}>
                    {formatNOK(portfolio.varianceNok)}
                  </strong>
                  {portfolio.variancePercentOfBudget != null
                    ? ` (${portfolio.variancePercentOfBudget.toFixed(1)} % av budsjett).`
                    : '.'}
                </p>
              )}
            </div>
          ) : null}

          {kind === 'checklist' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Fullførte punkter av totalt antall sjekklistepunkter i <strong style={{ color: 'var(--text)' }}>alle</strong>{' '}
                aktive prosjekter. Tomme prosjekter uten punkter påvirker ikke nevneren.
              </p>
              {portfolio.checklistTotal === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen sjekklistepunkter i aktive prosjekter ennå.
                </p>
              ) : (
                <ul className="space-y-3">
                  {rows.map(({ project, k }) => (
                    <li key={project.id} className="space-y-1.5">
                      <div className="flex justify-between gap-2 text-sm min-w-0">
                        <span className="font-medium truncate min-w-0" style={{ color: 'var(--text)' }}>
                          {project.name}
                        </span>
                        <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {k.checklistDone} / {k.checklistTotal}
                        </span>
                      </div>
                      {k.checklistTotal > 0 ? (
                        <div className="h-2 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (k.checklistDone / k.checklistTotal) * 100)}%`,
                              background: 'var(--text-muted)',
                            }}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <div
                className="rounded-xl border p-4 flex flex-wrap justify-between gap-2 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Samlet fremdrift</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {portfolio.checklistTotal === 0
                    ? '—'
                    : `${portfolio.checklistDone} / ${portfolio.checklistTotal}`}
                  {portfolio.checklistPercent != null ? ` (${portfolio.checklistPercent.toFixed(0)} %)` : ''}
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
