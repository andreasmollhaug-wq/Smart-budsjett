'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { useRenovationProjectStore } from './renovationProjectStore'
import type { RenovationProject } from './types'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { computePortfolioKpisForProjects, computeProjectKpis } from './kpis'
import {
  RENOVATION_PROJECT_BASE_PATH,
  RENOVATION_SCOPE_INFO_DISMISSED_STORAGE_KEY,
} from './paths'
import RenovationNewProjectModal from './RenovationNewProjectModal'
import RenovationPortfolioKpiModal, { type RenovationPortfolioKpiKind } from './RenovationPortfolioKpiModal'
import { FolderKanban, Hammer, ListChecks, Plus, Receipt, Wallet } from 'lucide-react'

function renovationProjectListMetaLine(p: RenovationProject): string | null {
  const bits: string[] = []
  if (p.location) bits.push(p.location)
  const range = renovationDateRangeLabel(p)
  if (range) bits.push(range)
  return bits.length ? bits.join(' · ') : null
}

function renovationDateRangeLabel(p: { startDate?: string; endDate?: string }): string | null {
  const { startDate, endDate } = p
  if (!startDate && !endDate) return null
  const a = startDate ? formatIsoDateDdMmYyyy(startDate) : null
  const b = endDate ? formatIsoDateDdMmYyyy(endDate) : null
  if (a && b) return `${a} – ${b}`
  if (a) return `fra ${a}`
  if (b) return `til ${b}`
  return null
}

export default function InternProsjektListPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const projects = useRenovationProjectStore((s) => s.projects)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [scopeInfoDismissed, setScopeInfoDismissed] = useState<boolean | null>(null)
  const [portfolioKpiModal, setPortfolioKpiModal] = useState<RenovationPortfolioKpiKind | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setScopeInfoDismissed(window.localStorage.getItem(RENOVATION_SCOPE_INFO_DISMISSED_STORAGE_KEY) === '1')
    } catch {
      setScopeInfoDismissed(false)
    }
  }, [])

  const activeProjects = projects.filter((p) => p.status === 'active')

  const portfolio = useMemo(() => computePortfolioKpisForProjects(projects), [projects])

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Oppussingsprosjekter"
        subtitle="Planlegg oppussing og prosjekter — eget budsjett og utgifter (se info under)"
      />
      <div className="min-w-0 space-y-6 max-w-4xl mx-auto py-4 sm:py-6 md:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {scopeInfoDismissed === false && (
          <div
            className="rounded-2xl px-4 py-3 text-sm break-words flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            role="status"
          >
            <p className="min-w-0 flex-1">
              <strong>Eget spor:</strong> Prosjektbudsjett og utgifter lagres på kontoen din og vises ikke i
              hovedbudsjettet eller transaksjonslisten. Bruk Budsjett og Transaksjoner for vanlig
              husholdningsøkonomi.
            </p>
            <button
              type="button"
              className="shrink-0 min-h-[44px] min-w-[44px] rounded-xl px-4 py-2 text-sm font-medium touch-manipulation sm:self-center"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              onClick={() => {
                try {
                  window.localStorage.setItem(RENOVATION_SCOPE_INFO_DISMISSED_STORAGE_KEY, '1')
                } catch {
                  /* ignore */
                }
                setScopeInfoDismissed(true)
              }}
            >
              Skjul
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Aktive prosjekter"
            value={String(portfolio.activeProjectCount)}
            sub="Totalt i arbeid"
            icon={FolderKanban}
            color="#3B5BDB"
            onClick={() => setPortfolioKpiModal('activeProjects')}
            aria-label="Aktive prosjekter — åpne detaljer"
          />
          <StatCard
            label="Samlet budsjett"
            value={formatNOK(portfolio.totalBudgetedNok)}
            sub={
              portfolio.totalBudgetedNok > 0
                ? `Gjenstår ${formatNOK(portfolio.remainingNok)}`
                : 'Ingen budsjettlinjer i aktive prosjekter'
            }
            icon={Wallet}
            color="#3B5BDB"
            valueNoWrap
            onClick={() => setPortfolioKpiModal('totalBudget')}
            aria-label="Samlet budsjett — åpne detaljer"
          />
          <StatCard
            label="Samlet faktisk"
            value={formatNOK(portfolio.totalActualNok)}
            sub={
              portfolio.budgetUtilizationPercent != null
                ? `${portfolio.budgetUtilizationPercent.toFixed(1)} % av samlet budsjett`
                : portfolio.activeProjectCount === 0
                  ? '—'
                  : 'Sett budsjett for å se andel brukt'
            }
            icon={Receipt}
            trend={portfolio.varianceNok <= 0 ? 'up' : 'down'}
            color={portfolio.varianceNok > 0 ? '#E03131' : '#0CA678'}
            valueNoWrap
            onClick={() => setPortfolioKpiModal('totalActual')}
            aria-label="Samlet faktisk — åpne detaljer"
          />
          <StatCard
            label="Sjekkliste (samlet)"
            value={
              portfolio.checklistTotal === 0 ? '—' : `${portfolio.checklistDone} / ${portfolio.checklistTotal}`
            }
            sub={
              portfolio.checklistPercent != null
                ? `${portfolio.checklistPercent.toFixed(0)} % ferdig`
                : 'Ingen punkter i aktive prosjekter'
            }
            icon={ListChecks}
            color="#495057"
            onClick={() => setPortfolioKpiModal('checklist')}
            aria-label="Sjekkliste samlet — åpne detaljer"
          />
        </div>

        {portfolioKpiModal !== null ? (
          <RenovationPortfolioKpiModal
            open
            kind={portfolioKpiModal}
            onClose={() => setPortfolioKpiModal(null)}
            portfolio={portfolio}
            activeProjects={activeProjects}
          />
        ) : null}

        <RenovationNewProjectModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-90 touch-manipulation"
            style={{ background: 'var(--primary)' }}
            aria-haspopup="dialog"
            aria-expanded={createModalOpen}
          >
            <Plus size={18} />
            Nytt prosjekt
          </button>
        </div>

        {activeProjects.length === 0 && !createModalOpen ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Hammer className="mx-auto mb-3 opacity-40" size={40} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen aktive prosjekter ennå. Opprett et for å følge budsjett og sjekkliste.
            </p>
          </div>
        ) : activeProjects.length > 0 ? (
          <ul className="space-y-3">
            {activeProjects.map((p) => {
              const k = computeProjectKpis(p)
              const metaLine = renovationProjectListMetaLine(p)
              return (
                <li key={p.id}>
                  <Link
                    href={`${RENOVATION_PROJECT_BASE_PATH}/${p.id}`}
                    className="block min-h-[56px] rounded-2xl p-4 sm:p-5 transition-opacity hover:opacity-95 active:opacity-90 touch-manipulation"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold break-words" style={{ color: 'var(--text)' }}>
                          {p.name}
                        </p>
                        {metaLine && (
                          <p className="text-xs mt-1 break-words" style={{ color: 'var(--text-muted)' }}>
                            {metaLine}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {p.templateKey === 'bathroom'
                            ? 'Mal: Bad'
                            : p.templateKey === 'kitchen'
                              ? 'Mal: Kjøkken'
                              : 'Egen'}
                        </p>
                      </div>
                      <div className="w-full shrink-0 text-left text-sm sm:w-auto sm:text-right">
                        <p style={{ color: 'var(--text-muted)' }}>Faktisk / budsjett</p>
                        <p className="font-semibold tabular-nums break-words" style={{ color: 'var(--text)' }}>
                          {formatNOK(k.totalActualNok)} / {formatNOK(k.totalBudgetedNok)}
                        </p>
                      </div>
                    </div>
                    {k.totalBudgetedNok > 0 && (
                      <div
                        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                        style={{ background: 'var(--border)' }}
                        aria-hidden
                      >
                        <div
                          className="h-full rounded-full transition-[width]"
                          style={{
                            width: `${Math.min(100, (k.totalActualNok / k.totalBudgetedNok) * 100)}%`,
                            background: 'var(--text-muted)',
                          }}
                        />
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
