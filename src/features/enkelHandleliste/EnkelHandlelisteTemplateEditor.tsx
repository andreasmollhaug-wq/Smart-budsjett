'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import { useEnkelHandlelisteCanMutate } from './useEnkelHandlelisteContext'
import type { EhTemplateLine } from './types'
import { ehPrimaryBtnClass, ehPrimaryBtnStyle } from './ehUi'

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

export function EnkelHandlelisteTemplateEditor({
  templateId,
  initialName,
  onClose,
}: {
  templateId: string | null
  initialName?: string
  onClose: () => void
}) {
  const existing = useEnkelHandlelisteStore((s) =>
    templateId ? s.templates.find((t) => t.id === templateId) : null,
  )
  const ehCreateTemplate = useEnkelHandlelisteStore((s) => s.ehCreateTemplate)
  const ehUpdateTemplate = useEnkelHandlelisteStore((s) => s.ehUpdateTemplate)
  const { activeProfileId } = useEnkelHandlelisteCanMutate()

  const [name, setName] = useState(existing?.name ?? initialName ?? '')
  const [weekday, setWeekday] = useState<number | null>(existing?.suggestedWeekday ?? null)
  const [linesText, setLinesText] = useState(existing?.lines.map((l) => l.name).join(', ') ?? '')

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setWeekday(existing.suggestedWeekday ?? null)
      setLinesText(existing.lines.map((l) => l.name).join(', '))
    }
  }, [existing])

  const parseLines = (): EhTemplateLine[] =>
    linesText
      .split(/[,;\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => ({ name: n, quantity: null }))

  const lineCount = parseLines().length
  const canSave = name.trim().length > 0 && lineCount > 0

  const save = () => {
    const lines = parseLines()
    if (!name.trim() || !lines.length) return
    if (templateId && existing) {
      ehUpdateTemplate(templateId, { name: name.trim(), lines, suggestedWeekday: weekday }, activeProfileId)
    } else {
      ehCreateTemplate({ name: name.trim(), lines, suggestedWeekday: weekday, profileId: activeProfileId })
    }
    onClose()
  }

  const inputStyle = { borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' } as const

  return (
    <div className="eh-anim-fade fixed inset-0 z-[100] flex flex-col" style={{ background: 'var(--bg)' }}>
      <header
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {templateId ? 'Rediger mal' : 'Ny mal'}
        </h2>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full active:opacity-70"
          onClick={onClose}
          aria-label="Lukk"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={22} aria-hidden />
        </button>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-xl flex-1 overflow-y-auto p-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Navn
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-5 min-h-[52px] w-full rounded-2xl border px-4 text-base outline-none"
          style={inputStyle}
        />

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Foreslått ukedag (valgfritt)
        </label>
        <div className="mb-5 flex flex-wrap gap-2">
          {WEEKDAYS.map((d, idx) => {
            const on = weekday === idx
            return (
              <button
                key={d}
                type="button"
                onClick={() => setWeekday(on ? null : idx)}
                className="min-h-[44px] min-w-[48px] touch-manipulation rounded-xl border px-3 text-sm font-semibold active:scale-95"
                style={{
                  borderColor: on ? 'var(--primary)' : 'var(--border)',
                  background: on ? 'var(--primary)' : 'var(--surface)',
                  color: on ? '#fff' : 'var(--text)',
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Varer {lineCount > 0 && <span style={{ color: 'var(--primary)' }}>· {lineCount}</span>}
        </label>
        <textarea
          value={linesText}
          onChange={(e) => setLinesText(e.target.value)}
          className="min-h-[140px] w-full rounded-2xl border px-4 py-3 text-base outline-none"
          style={inputStyle}
          placeholder="brød, melk, ost…"
        />
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          Skill varene med komma eller linjeskift.
        </p>
      </div>

      <div
        className="mx-auto w-full max-w-xl shrink-0 p-4"
        style={{ borderTop: '1px solid var(--border)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button type="button" className={`w-full ${ehPrimaryBtnClass}`} style={ehPrimaryBtnStyle} disabled={!canSave} onClick={save}>
          Lagre mal
        </button>
      </div>
    </div>
  )
}
