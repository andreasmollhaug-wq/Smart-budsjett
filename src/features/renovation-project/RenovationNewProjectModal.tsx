'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useRenovationProjectStore, buildNewProjectFromTemplate } from './renovationProjectStore'
import { buildChecklistFromTemplate } from './templates'
import type { RenovationTemplateKey } from './types'

const TEMPLATE_OPTIONS: { key: RenovationTemplateKey; label: string }[] = [
  { key: 'bathroom', label: 'Bad' },
  { key: 'kitchen', label: 'Kjøkken' },
  { key: 'custom', label: 'Tomt (egen sjekkliste)' },
]

const TITLE_ID = 'renovation-new-project-modal-title'

type Props = {
  open: boolean
  onClose: () => void
}

export default function RenovationNewProjectModal({ open, onClose }: Props) {
  const addProject = useRenovationProjectStore((s) => s.addProject)

  const [name, setName] = useState('')
  const [templateKey, setTemplateKey] = useState<RenovationTemplateKey>('bathroom')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = useCallback(() => {
    setName('')
    setTemplateKey('bathroom')
    setLocation('')
    setStartDate('')
    setEndDate('')
    setNotes('')
  }, [])

  useEffect(() => {
    if (!open) return
    resetForm()
  }, [open, resetForm])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const createDateRangeWarning = useMemo(() => {
    const s = startDate.trim()
    const e = endDate.trim()
    if (!s || !e) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null
    if (e < s) return 'Sluttdato er før startdato.'
    return null
  }, [startDate, endDate])

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
    resetForm()
    onClose()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 touch-manipulation"
        aria-label="Lukk"
        onClick={handleClose}
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl shadow-xl min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b p-5 min-w-0 shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id={TITLE_ID} className="text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              Nytt prosjekt
            </h2>
            <p className="text-xs leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Navn og mal er obligatorisk. Resten kan du fylle ut senere.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
            aria-label="Lukk"
          >
            <X size={22} style={{ color: 'var(--text-muted)' }} aria-hidden />
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-5 min-w-0">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor="renovation-new-name">
                Prosjektnavn
              </label>
              <input
                id="renovation-new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                placeholder="F.eks. Bad 2. etasje"
                autoFocus
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor="renovation-new-template">
                Mal (sjekkliste)
              </label>
              <select
                id="renovation-new-template"
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

            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <p className="mb-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Valgfritt — samme felter finner du på prosjektsiden senere
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor="renovation-new-location">
                    Sted
                  </label>
                  <input
                    id="renovation-new-location"
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
                    <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor="renovation-new-start">
                      Startdato
                    </label>
                    <input
                      id="renovation-new-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor="renovation-new-end">
                      Sluttdato (mål)
                    </label>
                    <input
                      id="renovation-new-end"
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
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor="renovation-new-notes">
                    Notater
                  </label>
                  <textarea
                    id="renovation-new-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Kort om plan, kontakter …"
                    className="min-h-[5rem] w-full resize-y rounded-xl border px-3 py-2.5 text-base leading-relaxed sm:text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:flex-wrap sm:justify-end sm:p-5"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium touch-manipulation sm:w-auto"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-medium text-white touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] enabled:transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{ background: 'var(--primary)' }}
            >
              Opprett
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
