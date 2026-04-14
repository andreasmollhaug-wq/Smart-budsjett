'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useRenovationProjectStore } from './renovationProjectStore'
import { computeProjectKpis } from './kpis'
import { formatNOK, formatIntegerNbNo, generateId, parseIntegerNbNo } from '@/lib/utils'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import {
  BUDGET_LINE_LABEL_SUGGESTIONS,
  datalistOptionsForBudgetLines,
} from './budgetLineSuggestions'

function parseNonNegativeAmount(s: string): number {
  const cleaned = s.replace(/\s/g, '').replace(/\u00a0/g, '')
  if (!cleaned) return NaN
  const digits = cleaned.replace(/[^0-9]/g, '')
  if (!digits) return NaN
  const n = parseInt(digits, 10)
  return Number.isFinite(n) && n >= 0 ? n : NaN
}

function todayYyyyMmDd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function InternProsjektDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = typeof params.projectId === 'string' ? params.projectId : ''

  const projects = useRenovationProjectStore((s) => s.projects)
  const updateProjectMeta = useRenovationProjectStore((s) => s.updateProjectMeta)
  const removeProject = useRenovationProjectStore((s) => s.removeProject)
  const addBudgetLine = useRenovationProjectStore((s) => s.addBudgetLine)
  const updateBudgetLine = useRenovationProjectStore((s) => s.updateBudgetLine)
  const removeBudgetLine = useRenovationProjectStore((s) => s.removeBudgetLine)
  const addExpense = useRenovationProjectStore((s) => s.addExpense)
  const removeExpense = useRenovationProjectStore((s) => s.removeExpense)
  const setChecklistItemDone = useRenovationProjectStore((s) => s.setChecklistItemDone)
  const addChecklistItem = useRenovationProjectStore((s) => s.addChecklistItem)
  const removeChecklistItem = useRenovationProjectStore((s) => s.removeChecklistItem)

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  const [nameDraft, setNameDraft] = useState('')
  const [lineLabel, setLineLabel] = useState('')
  const [lineAmount, setLineAmount] = useState('')
  const [expDate, setExpDate] = useState(todayYyyyMmDd())
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expLineId, setExpLineId] = useState<string>('')
  const [checkNew, setCheckNew] = useState('')
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editLineLabel, setEditLineLabel] = useState('')
  const [editLineAmount, setEditLineAmount] = useState('')

  const kpis = project ? computeProjectKpis(project) : null

  useEffect(() => {
    if (!projectId) return
    const p = projects.find((x) => x.id === projectId)
    if (p) setNameDraft(p.name)
    // Kun ved navigering til annet prosjekt — ikke når `projects` oppdateres under redigering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (!projectId) {
    return null
  }

  if (!project) {
    return (
      <div className="flex-1 min-h-0 overflow-auto p-8" style={{ background: 'var(--bg)' }}>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Fant ikke prosjektet.
        </p>
        <Link href="/intern/prosjekt" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
          Tilbake til listen
        </Link>
      </div>
    )
  }

  const handleSaveName = () => {
    const n = nameDraft.trim()
    if (n) updateProjectMeta(project.id, { name: n })
  }

  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault()
    const label = lineLabel.trim()
    const amt = parseNonNegativeAmount(lineAmount)
    if (!label || !Number.isFinite(amt)) return
    addBudgetLine(project.id, {
      id: generateId(),
      label,
      budgetedNok: amt,
    })
    setLineLabel('')
    setLineAmount('')
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseIntegerNbNo(expAmount)
    const desc = expDesc.trim()
    if (!Number.isFinite(amt) || !desc) return
    addExpense(project.id, {
      id: generateId(),
      date: expDate,
      amountNok: amt,
      description: desc,
      budgetLineId: expLineId || null,
      createdAt: new Date().toISOString(),
    })
    setExpAmount('')
    setExpDesc('')
    setExpLineId('')
    setExpDate(todayYyyyMmDd())
  }

  const sortedExpenses = [...project.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const budgetLineDatalistId = `renovation-bl-${project.id}`
  const budgetLineDatalistOptions = datalistOptionsForBudgetLines(
    project.budgetLines.map((l) => l.label),
  )
  const quickPickLabels = BUDGET_LINE_LABEL_SUGGESTIONS.slice(0, 8)

  const startEditLine = (lineId: string) => {
    const line = project.budgetLines.find((l) => l.id === lineId)
    if (!line) return
    setEditingLineId(lineId)
    setEditLineLabel(line.label)
    setEditLineAmount(formatIntegerNbNo(line.budgetedNok))
  }

  const cancelEditLine = () => {
    setEditingLineId(null)
    setEditLineLabel('')
    setEditLineAmount('')
  }

  const saveEditLine = () => {
    if (!editingLineId) return
    const label = editLineLabel.trim()
    const amt = parseNonNegativeAmount(editLineAmount)
    if (!label || !Number.isFinite(amt)) return
    updateBudgetLine(project.id, editingLineId, { label, budgetedNok: amt })
    cancelEditLine()
  }

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title={project.name}
        subtitle="Prosjektmodul (intern) — ikke synkronisert med hovedbudsjett"
        titleAddon={
          <Link
            href="/intern/prosjekt"
            className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ color: 'var(--primary)', background: 'var(--primary-pale)' }}
          >
            <ArrowLeft size={14} />
            Liste
          </Link>
        }
      />
      <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 md:p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Prosjektnavn
            </label>
            <input
              value={nameDraft || project.name}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleSaveName}
              className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
          <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
          <button
            type="button"
            onClick={() => {
              updateProjectMeta(project.id, { status: 'archived' })
              router.push('/intern/prosjekt')
            }}
            className="min-h-[44px] flex-1 rounded-xl px-3 py-2.5 text-sm sm:flex-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Arkiver
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.confirm('Slette prosjektet permanent?')) {
                removeProject(project.id)
                router.push('/intern/prosjekt')
              }
            }}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm sm:flex-none"
            style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}
          >
            <Trash2 size={16} />
            Slett
          </button>
          </div>
        </div>

        {kpis && (
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Budsjett (sum)" value={formatNOK(kpis.totalBudgetedNok)} />
            <KpiCard label="Faktisk (sum)" value={formatNOK(kpis.totalActualNok)} />
            <KpiCard
              label="Avvik"
              value={formatNOK(kpis.varianceNok)}
              hint={
                kpis.variancePercentOfBudget != null
                  ? `${kpis.variancePercentOfBudget.toFixed(1)} % av budsjett`
                  : undefined
              }
            />
            <KpiCard
              label="Sjekkliste"
              value={
                kpis.checklistTotal === 0
                  ? '—'
                  : `${kpis.checklistDone} / ${kpis.checklistTotal}`
              }
              hint={
                kpis.checklistPercent != null ? `${kpis.checklistPercent.toFixed(0)} % ferdig` : undefined
              }
            />
          </div>
        )}

        {kpis && kpis.uncategorizedActualNok > 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ukategoriserte utgifter: <strong style={{ color: 'var(--text)' }}>{formatNOK(kpis.uncategorizedActualNok)}</strong>
          </p>
        )}

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Budsjettlinjer
          </h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Skriv fritt (f.eks. «Rørlegger Petter», «Flis fra Mega») eller bruk forslag under. Du kan endre
            navn og beløp på eksisterende linjer med blyanten.
          </p>
          <datalist id={budgetLineDatalistId}>
            {budgetLineDatalistOptions.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Hurtigvalg (fyller inn post-feltet — rediger fritt etterpå):
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPickLabels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setLineLabel(label)}
                className="min-h-[40px] rounded-full border px-3 py-2 text-left text-xs font-medium leading-snug transition-opacity hover:opacity-90 active:opacity-90 sm:py-1.5"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={handleAddLine} className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:min-w-[140px]">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Post / leverandør (fritt navn)
              </label>
              <input
                value={lineLabel}
                onChange={(e) => setLineLabel(e.target.value)}
                list={budgetLineDatalistId}
                placeholder="F.eks. Rørlegger Petter"
                autoComplete="off"
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Budsjett (kr)
              </label>
              <input
                value={lineAmount}
                onChange={(e) => setLineAmount(e.target.value)}
                placeholder="25 000"
                inputMode="numeric"
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base tabular-nums sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium text-white sm:w-auto"
              style={{ background: 'var(--primary)' }}
            >
              Legg til
            </button>
          </form>

          {/* Mobil: kort i stedet for smal tabell */}
          <div className="space-y-3 md:hidden">
            {kpis?.lineRows.map((row) =>
              editingLineId === row.lineId ? (
                <div
                  key={row.lineId}
                  className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <input
                    value={editLineLabel}
                    onChange={(e) => setEditLineLabel(e.target.value)}
                    list={budgetLineDatalistId}
                    className="min-h-[44px] w-full rounded-lg border px-3 py-2.5 text-base"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <input
                    value={editLineAmount}
                    onChange={(e) => setEditLineAmount(e.target.value)}
                    inputMode="numeric"
                    placeholder="Budsjett (kr)"
                    className="min-h-[44px] w-full rounded-lg border px-3 py-2.5 text-base tabular-nums"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEditLine}
                      className="min-h-[44px] flex-1 rounded-lg text-sm font-medium text-white"
                      style={{ background: 'var(--primary)' }}
                    >
                      Lagre
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditLine}
                      className="min-h-[44px] flex-1 rounded-lg text-sm"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={row.lineId}
                  className="rounded-xl border p-4"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 font-medium leading-snug" style={{ color: 'var(--text)' }}>
                      {row.label}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Rediger linje"
                        onClick={() => startEditLine(row.lineId)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label="Slett linje"
                        onClick={() => removeBudgetLine(project.id, row.lineId)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Budsjett
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatNOK(row.budgetedNok)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Faktisk
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatNOK(row.actualNok)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Avvik
                      </dt>
                      <dd
                        className="mt-0.5 text-sm font-semibold tabular-nums"
                        style={{ color: row.varianceNok > 0 ? 'var(--danger)' : 'var(--success)' }}
                      >
                        {formatNOK(row.varianceNok)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ),
            )}
            {(!kpis || kpis.lineRows.length === 0) && (
              <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Ingen budsjettlinjer ennå.
              </p>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border touch-pan-x" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left p-3 font-medium">Post</th>
                  <th className="text-right p-3 font-medium">Budsjett</th>
                  <th className="text-right p-3 font-medium">Faktisk</th>
                  <th className="text-right p-3 font-medium">Avvik</th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {kpis?.lineRows.map((row) => (
                  <tr key={row.lineId} style={{ borderBottom: '1px solid var(--border)' }}>
                    {editingLineId === row.lineId ? (
                      <>
                        <td className="p-2 align-top">
                          <input
                            value={editLineLabel}
                            onChange={(e) => setEditLineLabel(e.target.value)}
                            list={budgetLineDatalistId}
                            className="w-full min-w-[160px] rounded-lg border px-2 py-1.5 text-sm"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button
                              type="button"
                              onClick={saveEditLine}
                              className="min-h-[40px] rounded-lg px-3 text-xs font-medium text-white"
                              style={{ background: 'var(--primary)' }}
                            >
                              Lagre
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditLine}
                              className="min-h-[40px] rounded-lg border px-3 text-xs"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                            >
                              Avbryt
                            </button>
                          </div>
                        </td>
                        <td className="p-2 align-top text-right">
                          <input
                            value={editLineAmount}
                            onChange={(e) => setEditLineAmount(e.target.value)}
                            className="w-full max-w-[120px] ml-auto rounded-lg border px-2 py-1.5 text-sm tabular-nums"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                        </td>
                        <td className="p-2 align-top text-right tabular-nums">{formatNOK(row.actualNok)}</td>
                        <td className="p-2 align-top text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          …
                        </td>
                        <td className="p-2 align-top" />
                      </>
                    ) : (
                      <>
                        <td className="p-3">{row.label}</td>
                        <td className="p-3 text-right tabular-nums">{formatNOK(row.budgetedNok)}</td>
                        <td className="p-3 text-right tabular-nums">{formatNOK(row.actualNok)}</td>
                        <td
                          className="p-3 text-right tabular-nums"
                          style={{ color: row.varianceNok > 0 ? 'var(--danger)' : 'var(--success)' }}
                        >
                          {formatNOK(row.varianceNok)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              aria-label="Rediger linje"
                              onClick={() => startEditLine(row.lineId)}
                              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg hover:opacity-80"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Slett linje"
                              onClick={() => removeBudgetLine(project.id, row.lineId)}
                              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg hover:opacity-80"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {(!kpis || kpis.lineRows.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                      Ingen budsjettlinjer ennå.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Utgifter (prosjekt)
          </h2>
          <form
            onSubmit={handleAddExpense}
            className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2 lg:grid-cols-12 lg:items-end"
          >
            <div className="lg:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Dato
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Beløp (kr)
              </label>
              <input
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="5 000"
                inputMode="numeric"
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base tabular-nums sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Beskrivelse (fritt, f.eks. faktura eller vare)
              </label>
              <input
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="F.eks. Delbetaling rørlegger"
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Budsjettlinje (valgfritt)
              </label>
              <select
                value={expLineId}
                onChange={(e) => setExpLineId(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                <option value="">Ukategorisert</option>
                {project.budgetLines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end lg:col-span-1">
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-xl px-3 py-3 text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                Legg inn
              </button>
            </div>
          </form>
          <ul className="space-y-2">
            {sortedExpenses.map((ex) => (
              <li
                key={ex.id}
                className="flex flex-col gap-2 rounded-xl border px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium leading-snug" style={{ color: 'var(--text)' }}>
                    {ex.description}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{ex.date}</span>
                    {ex.budgetLineId && (
                      <span className="rounded-md px-1.5 py-0.5" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
                        {project.budgetLines.find((l) => l.id === ex.budgetLineId)?.label ?? 'Linje'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <span className="text-base font-semibold tabular-nums">{formatNOK(ex.amountNok)}</span>
                  <button
                    type="button"
                    aria-label="Slett utgift"
                    onClick={() => removeExpense(project.id, ex.id)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
            {sortedExpenses.length === 0 && (
              <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ingen utgifter registrert.
              </li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Sjekkliste
          </h2>
          <ul className="space-y-2 mb-4">
            {[...project.checklist]
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border px-3 py-3 sm:items-center"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={(e) => setChecklistItemDone(project.id, c.id, e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded sm:mt-0"
                  />
                  <span
                    className="min-w-0 flex-1 text-base leading-snug sm:text-sm"
                    style={{
                      color: 'var(--text)',
                      textDecoration: c.done ? 'line-through' : undefined,
                      opacity: c.done ? 0.7 : 1,
                    }}
                  >
                    {c.label}
                  </span>
                  <button
                    type="button"
                    aria-label="Fjern punkt"
                    onClick={() => removeChecklistItem(project.id, c.id)}
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const t = checkNew.trim()
              if (!t) return
              addChecklistItem(project.id, t)
              setCheckNew('')
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={checkNew}
              onChange={(e) => setCheckNew(e.target.value)}
              placeholder="Nytt punkt…"
              className="min-h-[44px] flex-1 rounded-xl border px-3 py-2.5 text-base sm:text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
            <button
              type="submit"
              className="min-h-[44px] shrink-0 rounded-xl px-4 py-3 text-sm font-medium text-white sm:px-6"
              style={{ background: 'var(--primary)' }}
            >
              Legg til
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 break-words text-base font-bold tabular-nums sm:text-lg" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
