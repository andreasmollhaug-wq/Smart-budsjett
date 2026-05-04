'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRenovationProjectStore, buildNewProjectFromTemplate } from './renovationProjectStore'
import { buildChecklistFromTemplate } from './templates'
import type { RenovationProject, RenovationTemplateKey } from './types'
import { renovationModalFooterClass, renovationModalScrollableMainClass } from './RenovationModalFrame'

export const RENOVATION_TEMPLATE_OPTIONS: { key: RenovationTemplateKey; label: string }[] = [
  { key: 'bathroom', label: 'Bad' },
  { key: 'kitchen', label: 'Kjøkken' },
  { key: 'custom', label: 'Tomt (egen sjekkliste)' },
]

type Props = {
  idPrefix: string
  onSuccess: (project: RenovationProject) => void
  onCancel: () => void
}

export default function RenovationCreateMainProjectForm({ idPrefix, onSuccess, onCancel }: Props) {
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

  const createDateRangeWarning = useMemo(() => {
    const s = startDate.trim()
    const e = endDate.trim()
    if (!s || !e) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null
    if (e < s) return 'Sluttdato er før startdato.'
    return null
  }, [startDate, endDate])

  const handleSubmit = (e: React.FormEvent) => {
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
    const result = addProject(project)
    if (!result.ok) {
      typeof window !== 'undefined' && window.alert(result.message)
      return
    }
    resetForm()
    onSuccess(project)
  }

  const handleCancel = () => {
    resetForm()
    onCancel()
  }

  const id = (suffix: string) => `${idPrefix}-${suffix}`

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className={renovationModalScrollableMainClass}>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor={id('name')}>
            Navn på prosjekt
          </label>
          <input
            id={id('name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            placeholder="F.eks. Lommedalsveien 12"
            autoFocus
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor={id('template')}>
            Mal (sjekkliste)
          </label>
          <select
            id={id('template')}
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value as RenovationTemplateKey)}
            className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            {RENOVATION_TEMPLATE_OPTIONS.map((o) => (
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
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor={id('location')}>
                Sted
              </label>
              <input
                id={id('location')}
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
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor={id('start')}>
                  Startdato
                </label>
                <input
                  id={id('start')}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor={id('end')}>
                  Sluttdato (mål)
                </label>
                <input
                  id={id('end')}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-base sm:text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            </div>
            {createDateRangeWarning ? (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {createDateRangeWarning}
              </p>
            ) : null}
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text)' }} htmlFor={id('notes')}>
                Notater
              </label>
              <textarea
                id={id('notes')}
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
        className={`flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 ${renovationModalFooterClass}`}
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          onClick={handleCancel}
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
  )
}
