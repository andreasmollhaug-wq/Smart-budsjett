'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { useRenovationProjectStore } from './renovationProjectStore'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import {
  computePortfolioKpisForProjects,
  computeProjectKpis,
  computeRollupProjectKpis,
  getActiveChildProjects,
  getActiveRootProjects,
} from './kpis'
import {
  RENOVATION_PROJECT_BASE_PATH,
  RENOVATION_SCOPE_INFO_DISMISSED_STORAGE_KEY,
} from './paths'
import RenovationNewProjectModal from './RenovationNewProjectModal'
import RenovationPortfolioKpiModal, { type RenovationPortfolioKpiKind } from './RenovationPortfolioKpiModal'
import RenovationOppussingInfoHeaderButton from './RenovationOppussingInfoHeaderButton'
import RenovationProjectListPreviewModal from './RenovationProjectListPreviewModal'
import { renovationProjectListMetaLine } from './renovationProjectListMeta'
import { ChevronRight, FolderKanban, Hammer, ListChecks, Plus, Receipt, Wallet } from 'lucide-react'

type RenovationCreateModalState =
  | { open: false }
  | { open: true; variant: 'main' }
  | { open: true; variant: 'sub'; defaultParentId?: string }

export default function InternProsjektListPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const projects = useRenovationProjectStore((s) => s.projects)
  const [createModal, setCreateModal] = useState<RenovationCreateModalState>({ open: false })
  const [scopeInfoDismissed, setScopeInfoDismissed] = useState<boolean | null>(null)
  const [portfolioKpiModal, setPortfolioKpiModal] = useState<RenovationPortfolioKpiKind | null>(null)
  const [previewChildId, setPreviewChildId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setScopeInfoDismissed(window.localStorage.getItem(RENOVATION_SCOPE_INFO_DISMISSED_STORAGE_KEY) === '1')
    } catch {
      setScopeInfoDismissed(false)
    }
  }, [])

  const activeRoots = useMemo(() => getActiveRootProjects(projects), [projects])

  const portfolio = useMemo(() => computePortfolioKpisForProjects(projects), [projects])

  const activeProjectsSubcopy =
    portfolio.activeSubprojectCount > 0
      ? `${portfolio.activeSubprojectCount} rom/under · ${portfolio.activeProjectCount} hoved`
      : 'Kun aktive hovedprosjekter (rom listes der)'

  const previewChild = previewChildId ? (projects.find((x) => x.id === previewChildId) ?? null) : null
  const previewChildParent =
    previewChild?.parentId != null ? (projects.find((x) => x.id === previewChild.parentId) ?? null) : null

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Oppussingsprosjekter"
        subtitle="Prosjektbudsjett og utgifter på konto — adskilt fra vanlig budsjett"
        titleAddon={<RenovationOppussingInfoHeaderButton variant="list" />}
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
              husholdningsøkonomi. Du kan ha <strong>hovedprosjekter</strong> (f.eks. et hus) med{' '}
              <strong>rom og underprosjekter</strong> under.
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
            label="Aktive hovedprosjekt"
            value={String(portfolio.activeProjectCount)}
            sub={activeProjectsSubcopy}
            icon={FolderKanban}
            color="#3B5BDB"
            onClick={() => setPortfolioKpiModal('activeProjects')}
            aria-label="Aktive hovedprosjekt — åpne detaljer"
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
            projects={projects}
          />
        ) : null}

        <RenovationNewProjectModal
          open={createModal.open}
          variant={createModal.open ? createModal.variant : 'main'}
          defaultParentId={createModal.open && createModal.variant === 'sub' ? createModal.defaultParentId : undefined}
          onClose={() => setCreateModal({ open: false })}
        />

        <RenovationProjectListPreviewModal
          open={previewChildId !== null && previewChild != null}
          project={previewChild}
          parent={previewChildParent}
          detailHref={`${RENOVATION_PROJECT_BASE_PATH}/${previewChild?.id ?? ''}`}
          onClose={() => setPreviewChildId(null)}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModal({ open: true, variant: 'main' })}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-90 touch-manipulation"
            style={{ background: 'var(--primary)' }}
            aria-haspopup="dialog"
            aria-expanded={createModal.open && createModal.variant === 'main'}
          >
            <Plus size={18} />
            Nytt hovedprosjekt
          </button>
          <button
            type="button"
            onClick={() => setCreateModal({ open: true, variant: 'sub' })}
            disabled={activeRoots.length === 0}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 active:opacity-90 touch-manipulation disabled:cursor-not-allowed disabled:opacity-45"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            title={activeRoots.length === 0 ? 'Opprett et hovedprosjekt først' : undefined}
            aria-haspopup="dialog"
            aria-expanded={createModal.open && createModal.variant === 'sub'}
          >
            <Plus size={18} />
            Nytt rom / underprosjekt
          </button>
        </div>

        {activeRoots.length === 0 && !createModal.open ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Hammer className="mx-auto mb-3 opacity-40" size={40} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen aktive hovedprosjekter ennå. Opprett et hus eller et fritt prosjekt, og legg til rom under.
            </p>
          </div>
        ) : activeRoots.length > 0 ? (
          <ul className="space-y-4">
            {activeRoots.map((p) => {
              const rollup = computeRollupProjectKpis(p, projects)
              const children = getActiveChildProjects(p.id, projects)
              const metaLine = renovationProjectListMetaLine(p)
              return (
                <li key={p.id} className="space-y-2">
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
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Hovedprosjekt · medregner {children.length}{' '}
                          {children.length === 1 ? 'rom/underprosjekt' : 'rom/underprosjekter'}
                          {rollup.totalBudgetedNok > 0 ? ' · sum hus' : ''}
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
                          {formatNOK(rollup.totalActualNok)} / {formatNOK(rollup.totalBudgetedNok)}
                        </p>
                      </div>
                    </div>
                    {rollup.totalBudgetedNok > 0 && (
                      <div
                        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                        style={{ background: 'var(--border)' }}
                        aria-hidden
                      >
                        <div
                          className="h-full rounded-full transition-[width]"
                          style={{
                            width: `${Math.min(
                              100,
                              (rollup.totalActualNok / rollup.totalBudgetedNok) * 100,
                            )}%`,
                            background: 'var(--text-muted)',
                          }}
                        />
                      </div>
                    )}
                  </Link>
                  {children.length > 0 ? (
                    <ul className="pl-2 sm:pl-4 border-l-2 ml-3 space-y-1.5 min-w-0" style={{ borderColor: 'var(--border)' }}>
                      {children.map((c) => {
                        const k = computeProjectKpis(c)
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => setPreviewChildId(c.id)}
                              className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-opacity hover:opacity-90 active:opacity-90 touch-manipulation min-w-0"
                              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                              aria-haspopup="dialog"
                              aria-expanded={previewChildId === c.id}
                              aria-label={`${c.name} — åpne kort oversikt`}
                            >
                              <ChevronRight className="shrink-0 opacity-45" size={16} aria-hidden />
                              <span className="min-w-0 flex-1 truncate font-medium" style={{ color: 'var(--text)' }}>
                                {c.name}
                              </span>
                              <span className="shrink-0 tabular-nums text-xs font-medium sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                                {formatNOK(k.totalActualNok)} / {formatNOK(k.totalBudgetedNok)}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs pl-2 sm:pl-1" style={{ color: 'var(--text-muted)' }}>
                      Tips: Åpne hovedprosjektet eller bruk «Nytt rom» for å legge til kjøkken, bad og mer.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
