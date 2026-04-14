'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useRenovationProjectStore, buildNewProjectFromTemplate } from './renovationProjectStore'
import { buildChecklistFromTemplate } from './templates'
import type { RenovationTemplateKey } from './types'
import { formatNOK } from '@/lib/utils'
import { computeProjectKpis } from './kpis'
import { Plus, Hammer } from 'lucide-react'

const TEMPLATE_OPTIONS: { key: RenovationTemplateKey; label: string }[] = [
  { key: 'bathroom', label: 'Bad' },
  { key: 'kitchen', label: 'Kjøkken' },
  { key: 'custom', label: 'Tomt (egen sjekkliste)' },
]

export default function InternProsjektListPage() {
  const projects = useRenovationProjectStore((s) => s.projects)
  const addProject = useRenovationProjectStore((s) => s.addProject)

  const [name, setName] = useState('')
  const [templateKey, setTemplateKey] = useState<RenovationTemplateKey>('bathroom')
  const [openForm, setOpenForm] = useState(false)

  const activeProjects = projects.filter((p) => p.status === 'active')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const checklist = buildChecklistFromTemplate(templateKey)
    const project = buildNewProjectFromTemplate({ name: n, templateKey, checklist })
    addProject(project)
    setName('')
    setOpenForm(false)
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Oppussingsprosjekter"
        subtitle="Intern testmodul — ikke en del av hovedbudsjettet eller transaksjonslisten"
      />
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div
          className="rounded-2xl px-4 py-3 text-sm break-words"
          style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <strong>Intern test:</strong> Data lagres separat for din bruker og blandes ikke inn i Budsjett eller
          Transaksjoner. Direktelenke: <code className="text-xs break-all">/intern/prosjekt</code>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpenForm((o) => !o)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-90"
            style={{ background: 'var(--primary)' }}
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
                onClick={() => setOpenForm(false)}
                className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium sm:w-auto"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
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
              return (
                <li key={p.id}>
                  <Link
                    href={`/intern/prosjekt/${p.id}`}
                    className="block min-h-[56px] rounded-2xl p-4 sm:p-5 transition-opacity hover:opacity-95 active:opacity-90"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>
                          {p.name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {p.templateKey === 'bathroom'
                            ? 'Mal: Bad'
                            : p.templateKey === 'kitchen'
                              ? 'Mal: Kjøkken'
                              : 'Egen'}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p style={{ color: 'var(--text-muted)' }}>Faktisk / budsjett</p>
                        <p className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {formatNOK(k.totalActualNok)} / {formatNOK(k.totalBudgetedNok)}
                        </p>
                      </div>
                    </div>
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
