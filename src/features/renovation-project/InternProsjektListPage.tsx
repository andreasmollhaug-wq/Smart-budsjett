'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { useRenovationProjectStore, buildNewProjectFromTemplate } from './renovationProjectStore'
import { buildChecklistFromTemplate } from './templates'
import type { RenovationProject, RenovationTemplateKey } from './types'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { computePortfolioKpisForProjects, computeProjectKpis } from './kpis'
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

const TEMPLATE_OPTIONS: { key: RenovationTemplateKey; label: string }[] = [
  { key: 'bathroom', label: 'Bad' },
  { key: 'kitchen', label: 'Kjøkken' },
  { key: 'custom', label: 'Tomt (egen sjekkliste)' },
]

export default function InternProsjektListPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const projects = useRenovationProjectStore((s) => s.projects)
  const addProject = useRenovationProjectStore((s) => s.addProject)

  const [name, setName] = useState('')
  const [templateKey, setTemplateKey] = useState<RenovationTemplateKey>('bathroom')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [openForm, setOpenForm] = useState(false)

  const activeProjects = projects.filter((p) => p.status === 'active')

  const portfolio = useMemo(() => computePortfolioKpisForProjects(projects), [projects])

  const createDateRangeWarning = useMemo(() => {
    const s = startDate.trim()
    const e = endDate.trim()
    if (!s || !e) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null
    if (e < s) return 'Sluttdato er før startdato.'
    return null
  }, [startDate, endDate])

  const resetCreateForm = useCallback(() => {
    setName('')
    setTemplateKey('bathroom')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setNotes('')
  }, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const checklist = buildChecklistFromTemplate(templateKey)
    const project = buildNewProjectFromTemplate({
      name: n,
      templateKey,
      checklist,
      location,
      startDate,
      endDate,
      notes,
    })
    addProject(project)
    resetCreateForm()
    setOpenForm(false)
  }

  const handleToggleNewProject = () => {
    setOpenForm((wasOpen) => {
      if (wasOpen) {
        resetCreateForm()
        return false
      }
      resetCreateForm()
      return true
    })
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Oppussingsprosjekter"
        subtitle="Intern testmodul — ikke en del av hovedbudsjettet eller transaksjonslisten"
      />
      <div className="min-w-0 space-y-6 max-w-4xl mx-auto py-4 sm:py-6 md:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div
          className="rounded-2xl px-4 py-3 text-sm break-words"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <strong>Intern test:</strong> Data lagres separat for din bruker og blandes ikke inn i Budsjett eller
          Transaksjoner. Direktelenke: <code className="text-xs break-all">/intern/prosjekt</code>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Aktive prosjekter"
            value={String(portfolio.activeProjectCount)}
            sub="Totalt i arbeid"
            icon={FolderKanban}
            color="#3B5BDB"
            info="Antall prosjekter med status aktiv (arkiverte telles ikke)."
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
            info="Sum av alle budsjettlinjer på tvers av aktive prosjekter."
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
            info="Sum av alle registrerte utgifter i aktive prosjekter."
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
            info="Antall fullførte punkter av totalt antall sjekklistepunkter i alle aktive prosjekter."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleToggleNewProject}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-90 touch-manipulation"
            style={{ background: 'var(--primary)' }}
            aria-expanded={openForm}
          >
            <Plus size={18} />
            Nytt prosjekt
          </button>
        </div>

        {openForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Prosjektnavn
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="F.eks. Bad 2. etasje"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Mal (sjekkliste)
              </label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value as RenovationTemplateKey)}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                {TEMPLATE_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                Valgfritt — samme felter finner du på prosjektsiden senere
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Sted
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    placeholder="F.eks. garasje, kjeller"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Startdato
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      Sluttdato (mål)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                </div>
                {createDateRangeWarning && (
                  <p className="text-xs" style={{ color: 'var(--danger)' }}>
                    {createDateRangeWarning}
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                    Notater
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Kort om plan, kontakter …"
                    className="w-full resize-y rounded-xl border px-3 py-2.5 text-base sm:text-sm leading-relaxed min-h-[5rem]"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium text-white sm:w-auto"
                style={{ background: 'var(--primary)' }}
              >
                Opprett
              </button>
              <button
                type="button"
                onClick={() => {
                  resetCreateForm()
                  setOpenForm(false)
                }}
                className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium sm:w-auto"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
              >
                Avbryt
              </button>
            </div>
          </form>
        )}

        {activeProjects.length === 0 && !openForm ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Hammer className="mx-auto mb-3 opacity-40" size={40} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen aktive prosjekter ennå. Opprett et for å følge budsjett og sjekkliste.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeProjects.map((p) => {
              const k = computeProjectKpis(p)
              const metaLine = renovationProjectListMetaLine(p)
              return (
                <li key={p.id}>
                  <Link
                    href={`/intern/prosjekt/${p.id}`}
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
        )}
      </div>
    </div>
  )
}
