'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { useRenovationProjectStore } from './renovationProjectStore'
import { computeProjectKpis } from './kpis'
import type { RenovationProjectExpense } from './types'
import {
  formatIsoDateDdMmYyyy,
  formatNOK,
  formatThousands,
  generateId,
  parseIntegerNbNo,
} from '@/lib/utils'
import { useFormattedThousandsInput } from '@/lib/useFormattedThousandsInput'
import { ArrowLeft, ListChecks, Pencil, Receipt, Scale, Trash2, Wallet } from 'lucide-react'
import {
  BUDGET_LINE_LABEL_SUGGESTIONS,
  datalistOptionsForBudgetLines,
} from './budgetLineSuggestions'

function parseNonNegativeAmount(s: string): number {
  const cleaned = s.replace(/\s/g, '').replace(/\u00a0/g, '').replace(/\u202f/g, '')
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
  const updateExpense = useRenovationProjectStore((s) => s.updateExpense)
  const removeExpense = useRenovationProjectStore((s) => s.removeExpense)
  const setChecklistItemDone = useRenovationProjectStore((s) => s.setChecklistItemDone)
  const addChecklistItem = useRenovationProjectStore((s) => s.addChecklistItem)
  const removeChecklistItem = useRenovationProjectStore((s) => s.removeChecklistItem)

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  )

  const [nameDraft, setNameDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [locationDraft, setLocationDraft] = useState('')
  const [startDateDraft, setStartDateDraft] = useState('')
  const [endDateDraft, setEndDateDraft] = useState('')
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editExpDate, setEditExpDate] = useState('')
  const [editExpAmount, setEditExpAmount] = useState('')
  const [editExpDesc, setEditExpDesc] = useState('')
  const [editExpLineId, setEditExpLineId] = useState('')

  const kpis = project ? computeProjectKpis(project) : null

  const lineAmountInput = useFormattedThousandsInput(lineAmount, setLineAmount)
  const editLineAmountInput = useFormattedThousandsInput(editLineAmount, setEditLineAmount)
  const expAmountInput = useFormattedThousandsInput(expAmount, setExpAmount)
  const editExpAmountInput = useFormattedThousandsInput(editExpAmount, setEditExpAmount)

  const dateRangeWarning = useMemo(() => {
    const s = startDateDraft.trim()
    const e = endDateDraft.trim()
    if (!s || !e) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null
    if (e < s) return 'Sluttdato er før startdato.'
    return null
  }, [startDateDraft, endDateDraft])

  useEffect(() => {
    if (!projectId) return
    const p = projects.find((x) => x.id === projectId)
    if (p) {
      setNameDraft(p.name)
      setNotesDraft(p.notes ?? '')
      setLocationDraft(p.location ?? '')
      setStartDateDraft(p.startDate ?? '')
      setEndDateDraft(p.endDate ?? '')
    }
    // Kun ved navigering til annet prosjekt — ikke når `projects` oppdateres under redigering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (!projectId) {
    return null
  }

  if (!project) {
    return (
      <div
        className="flex-1 min-h-0 overflow-auto p-4 sm:p-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--bg)' }}
      >
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Fant ikke prosjektet.
        </p>
        <Link href="/intern/prosjekt" className="inline-flex min-h-[44px] items-center text-sm font-medium" style={{ color: 'var(--primary)' }}>
          Tilbake til listen
        </Link>
      </div>
    )
  }

  const handleSaveName = () => {
    const n = nameDraft.trim()
    if (n) updateProjectMeta(project.id, { name: n })
  }

  const handleSaveNotes = () => {
    updateProjectMeta(project.id, { notes: notesDraft })
  }

  const handleSaveLocation = () => {
    updateProjectMeta(project.id, { location: locationDraft })
  }

  const handleSaveStartDate = () => {
    updateProjectMeta(project.id, { startDate: startDateDraft })
  }

  const handleSaveEndDate = () => {
    updateProjectMeta(project.id, { endDate: endDateDraft })
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

  const startEditExpense = (ex: RenovationProjectExpense) => {
    setEditingExpenseId(ex.id)
    setEditExpDate(ex.date)
    setEditExpAmount(formatThousands(String(ex.amountNok)))
    setEditExpDesc(ex.description)
    setEditExpLineId(ex.budgetLineId ?? '')
  }

  const cancelEditExpense = () => {
    setEditingExpenseId(null)
    setEditExpDate('')
    setEditExpAmount('')
    setEditExpDesc('')
    setEditExpLineId('')
  }

  const saveEditExpense = () => {
    if (!editingExpenseId) return
    const amt = parseIntegerNbNo(editExpAmount)
    const desc = editExpDesc.trim()
    if (!Number.isFinite(amt) || !desc) return
    updateExpense(project.id, editingExpenseId, {
      date: editExpDate,
      amountNok: amt,
      description: desc,
      budgetLineId: editExpLineId || null,
    })
    cancelEditExpense()
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
    setEditLineAmount(formatThousands(String(line.budgetedNok)))
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

  const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)' } as const

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title={project.name}
        subtitle="Prosjektmodul (intern) — ikke synkronisert med hovedbudsjett"
        titleAddon={
          <Link
            href="/intern/prosjekt"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-90 active:opacity-90 touch-manipulation"
            style={{ color: 'var(--text)', borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <ArrowLeft size={14} aria-hidden />
            Liste
          </Link>
        }
      />
      <div className="min-w-0 max-w-4xl mx-auto space-y-6 py-4 sm:py-6 md:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
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
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
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
                style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'var(--bg)' }}
              >
                <Trash2 size={16} />
                Slett
              </button>
            </div>
          </div>
        </div>

        <section className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Om prosjektet
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Valgfritt sted, periode og notater — typisk for hobby- og oppussingsprosjekter.
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor={`project-location-${project.id}`}
              style={{ color: 'var(--text-muted)' }}
            >
              Sted
            </label>
            <input
              id={`project-location-${project.id}`}
              type="text"
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              onBlur={handleSaveLocation}
              placeholder="F.eks. garasje, kjeller, hytta"
              className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-xs font-medium mb-1"
                htmlFor={`project-start-${project.id}`}
                style={{ color: 'var(--text-muted)' }}
              >
                Startdato
              </label>
              <input
                id={`project-start-${project.id}`}
                type="date"
                value={startDateDraft}
                onChange={(e) => setStartDateDraft(e.target.value)}
                onBlur={handleSaveStartDate}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1"
                htmlFor={`project-end-${project.id}`}
                style={{ color: 'var(--text-muted)' }}
              >
                Sluttdato (mål)
              </label>
              <input
                id={`project-end-${project.id}`}
                type="date"
                value={endDateDraft}
                onChange={(e) => setEndDateDraft(e.target.value)}
                onBlur={handleSaveEndDate}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
          </div>
          {dateRangeWarning && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {dateRangeWarning}
            </p>
          )}

          <div>
            <label
              className="block text-xs font-medium mb-1"
              htmlFor={`project-notes-${project.id}`}
              style={{ color: 'var(--text-muted)' }}
            >
              Notater
            </label>
            <textarea
              id={`project-notes-${project.id}`}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleSaveNotes}
              rows={5}
              placeholder="Adresse, kontakter, leverandører, avtaler …"
              className="w-full min-h-[7.5rem] resize-y rounded-xl border px-3 py-2.5 text-sm leading-relaxed"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
        </section>

        {kpis && (
          <>
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Budsjett (sum)"
                value={formatNOK(kpis.totalBudgetedNok)}
                sub={
                  kpis.totalBudgetedNok > 0
                    ? `Gjenstår ${formatNOK(kpis.totalBudgetedNok - kpis.totalActualNok)}`
                    : 'Ingen budsjettlinjer'
                }
                icon={Wallet}
                color="#3B5BDB"
                info="Sum av alle budsjettlinjer i prosjektet."
              />
              <StatCard
                label="Faktisk (sum)"
                value={formatNOK(kpis.totalActualNok)}
                sub={
                  kpis.totalBudgetedNok > 0
                    ? `${((kpis.totalActualNok / kpis.totalBudgetedNok) * 100).toFixed(1)} % av budsjett`
                    : 'Sett budsjett for å se andel brukt'
                }
                icon={Receipt}
                trend={kpis.varianceNok <= 0 ? 'up' : 'down'}
                color={kpis.varianceNok > 0 ? '#E03131' : '#0CA678'}
                info="Sum av alle registrerte utgifter."
              />
              <StatCard
                label="Avvik"
                value={formatNOK(kpis.varianceNok)}
                sub={
                  kpis.variancePercentOfBudget != null
                    ? `${kpis.variancePercentOfBudget.toFixed(1)} % av budsjett`
                    : '—'
                }
                icon={Scale}
                trend={kpis.varianceNok <= 0 ? 'up' : 'down'}
                color={kpis.varianceNok > 0 ? '#E03131' : '#0CA678'}
                info="Faktisk minus budsjettert (positivt tall betyr overforbruk)."
              />
              <StatCard
                label="Sjekkliste"
                value={
                  kpis.checklistTotal === 0 ? '—' : `${kpis.checklistDone} / ${kpis.checklistTotal}`
                }
                sub={
                  kpis.checklistPercent != null ? `${kpis.checklistPercent.toFixed(0)} % ferdig` : 'Ingen punkter'
                }
                icon={ListChecks}
                color="#495057"
                info="Antall avhukede punkter av totalt antall i sjekklisten."
              />
            </div>
            {kpis.totalBudgetedNok > 0 && (
              <div className="rounded-2xl px-4 py-4 sm:px-5" style={cardStyle}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    Andel brukt av budsjett
                  </span>
                  <span className="tabular-nums">
                    {((kpis.totalActualNok / kpis.totalBudgetedNok) * 100).toFixed(1)} %
                  </span>
                </div>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--border)' }}
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (kpis.totalActualNok / kpis.totalBudgetedNok) * 100)}%`,
                      background: 'var(--text-muted)',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {kpis && kpis.uncategorizedActualNok > 0 && (
          <p
            className="text-sm rounded-xl px-3 py-2"
            style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            Ukategoriserte utgifter:{' '}
            <strong style={{ color: 'var(--text)' }}>{formatNOK(kpis.uncategorizedActualNok)}</strong>
          </p>
        )}

        <section className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Budsjettlinjer
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Skriv fritt (f.eks. «Rørlegger Petter», «Flis fra Mega») eller bruk forslag under. Du kan endre
              navn og beløp på eksisterende linjer med blyanten.
            </p>
          </div>
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
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
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
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Budsjett (kr)
              </label>
              <input
                type="text"
                autoComplete="off"
                value={lineAmount}
                onChange={lineAmountInput.onChange}
                placeholder="f.eks. 25 000"
                inputMode="numeric"
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base tabular-nums sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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

          {kpis && (
            <p
              className="mb-3 text-xs tabular-nums leading-snug"
              style={{ color: 'var(--text-muted)' }}
              aria-live="polite"
            >
              Sum{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {formatNOK(kpis.totalBudgetedNok)}
              </span>
              <span className="mx-1.5 inline-block opacity-35 select-none" aria-hidden>
                ·
              </span>
              faktisk {formatNOK(kpis.totalActualNok)}
              <span className="mx-1.5 inline-block opacity-35 select-none" aria-hidden>
                ·
              </span>
              avvik{' '}
              <span
                className="font-medium"
                style={{ color: kpis.varianceNok > 0 ? 'var(--danger)' : 'var(--success)' }}
              >
                {formatNOK(kpis.varianceNok)}
              </span>
            </p>
          )}

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
                    type="text"
                    autoComplete="off"
                    value={editLineAmount}
                    onChange={editLineAmountInput.onChange}
                    inputMode="numeric"
                    placeholder="f.eks. 25 000"
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
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
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
                              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
                            >
                              Avbryt
                            </button>
                          </div>
                        </td>
                        <td className="p-2 align-top text-right">
                          <input
                            type="text"
                            autoComplete="off"
                            value={editLineAmount}
                            onChange={editLineAmountInput.onChange}
                            inputMode="numeric"
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

        <section className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Utgifter (prosjekt)
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Registrer utgifter knyttet til prosjektet. Knytt til en budsjettlinje for bedre oversikt.
            </p>
          </div>
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
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Beløp (kr)
              </label>
              <input
                type="text"
                autoComplete="off"
                value={expAmount}
                onChange={expAmountInput.onChange}
                placeholder="f.eks. 5 000"
                inputMode="numeric"
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base tabular-nums sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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
          {kpis && (
            <p
              className="mb-3 text-xs tabular-nums leading-snug"
              style={{ color: 'var(--text-muted)' }}
              aria-live="polite"
            >
              Sum{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {formatNOK(kpis.totalActualNok)}
              </span>
              <span className="mx-1.5 inline-block opacity-35 select-none" aria-hidden>
                ·
              </span>
              {sortedExpenses.length}{' '}
              {sortedExpenses.length === 1 ? 'utgift' : 'utgifter'}
              {kpis.uncategorizedActualNok > 0 ? (
                <>
                  <span className="mx-1.5 inline-block opacity-35 select-none" aria-hidden>
                    ·
                  </span>
                  ufordelt {formatNOK(kpis.uncategorizedActualNok)}
                </>
              ) : null}
            </p>
          )}
          <div className="md:hidden">
            <ul className="space-y-2">
              {sortedExpenses.map((ex) => (
                <li
                  key={ex.id}
                  className="rounded-xl border px-3 py-3 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  {editingExpenseId === ex.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            Dato
                          </label>
                          <input
                            type="date"
                            value={editExpDate}
                            onChange={(e) => setEditExpDate(e.target.value)}
                            className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            Beløp (kr)
                          </label>
                          <input
                            type="text"
                            autoComplete="off"
                            value={editExpAmount}
                            onChange={editExpAmountInput.onChange}
                            inputMode="numeric"
                            className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base tabular-nums sm:text-sm"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          Beskrivelse
                        </label>
                        <input
                          value={editExpDesc}
                          onChange={(e) => setEditExpDesc(e.target.value)}
                          className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          Budsjettlinje (valgfritt)
                        </label>
                        <select
                          value={editExpLineId}
                          onChange={(e) => setEditExpLineId(e.target.value)}
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
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={saveEditExpense}
                          className="min-h-[44px] flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white sm:flex-none"
                          style={{ background: 'var(--primary)' }}
                        >
                          Lagre
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditExpense}
                          className="min-h-[44px] flex-1 rounded-xl px-4 py-3 text-sm font-medium sm:flex-none"
                          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium leading-snug" style={{ color: 'var(--text)' }}>
                          {ex.description}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>{formatIsoDateDdMmYyyy(ex.date)}</span>
                          {ex.budgetLineId && (
                            <span
                              className="rounded-md border px-1.5 py-0.5"
                              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
                            >
                              {project.budgetLines.find((l) => l.id === ex.budgetLineId)?.label ?? 'Linje'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                        <span className="text-base font-semibold tabular-nums">{formatNOK(ex.amountNok)}</span>
                        <div className="flex min-w-0 flex-shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            aria-label="Rediger utgift"
                            onClick={() => startEditExpense(ex)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:opacity-80"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label="Slett utgift"
                            onClick={() => removeExpense(project.id, ex.id)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:opacity-80"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {sortedExpenses.length === 0 && (
                <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen utgifter registrert.
                </li>
              )}
            </ul>
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border touch-pan-x" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left p-3 font-medium w-[7.5rem]">Dato</th>
                  <th className="text-left p-3 font-medium min-w-[10rem]">Beskrivelse</th>
                  <th className="text-right p-3 font-medium w-[8rem]">Beløp</th>
                  <th className="text-left p-3 font-medium min-w-[9rem]">Budsjettlinje</th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((ex) => (
                  <tr key={ex.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {editingExpenseId === ex.id ? (
                      <>
                        <td className="p-2 align-top">
                          <input
                            type="date"
                            value={editExpDate}
                            onChange={(e) => setEditExpDate(e.target.value)}
                            className="w-full min-w-[9rem] rounded-lg border px-2 py-1.5 text-sm"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <input
                            value={editExpDesc}
                            onChange={(e) => setEditExpDesc(e.target.value)}
                            className="w-full min-w-[160px] rounded-lg border px-2 py-1.5 text-sm"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button
                              type="button"
                              onClick={saveEditExpense}
                              className="min-h-[40px] rounded-lg px-3 text-xs font-medium text-white"
                              style={{ background: 'var(--primary)' }}
                            >
                              Lagre
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditExpense}
                              className="min-h-[40px] rounded-lg border px-3 text-xs"
                              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
                            >
                              Avbryt
                            </button>
                          </div>
                        </td>
                        <td className="p-2 align-top text-right">
                          <input
                            type="text"
                            autoComplete="off"
                            value={editExpAmount}
                            onChange={editExpAmountInput.onChange}
                            inputMode="numeric"
                            className="w-full max-w-[8rem] ml-auto rounded-lg border px-2 py-1.5 text-sm tabular-nums"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <select
                            value={editExpLineId}
                            onChange={(e) => setEditExpLineId(e.target.value)}
                            className="w-full min-w-[8rem] rounded-lg border px-2 py-1.5 text-sm"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            <option value="">Ukategorisert</option>
                            {project.budgetLines.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 align-top" />
                      </>
                    ) : (
                      <>
                        <td className="p-3 whitespace-nowrap tabular-nums">
                          {formatIsoDateDdMmYyyy(ex.date)}
                        </td>
                        <td className="p-3">{ex.description}</td>
                        <td className="p-3 text-right tabular-nums font-medium">{formatNOK(ex.amountNok)}</td>
                        <td className="p-3" style={{ color: 'var(--text-muted)' }}>
                          {ex.budgetLineId
                            ? project.budgetLines.find((l) => l.id === ex.budgetLineId)?.label ?? '—'
                            : '—'}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              aria-label="Rediger utgift"
                              onClick={() => startEditExpense(ex)}
                              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg hover:opacity-80"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label="Slett utgift"
                              onClick={() => removeExpense(project.id, ex.id)}
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
                {sortedExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                      Ingen utgifter registrert.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl p-4 sm:p-6 space-y-4" style={cardStyle}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Sjekkliste
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Kryss av underveis. Legg til egne punkter etter behov.
            </p>
          </div>
          <ul className="space-y-2 mb-4">
            {[...project.checklist]
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border px-3 py-3 sm:items-center"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
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
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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
