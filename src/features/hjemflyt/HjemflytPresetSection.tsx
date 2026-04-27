'use client'

import { useCallback, useMemo, useState } from 'react'
import type { HjemflytTask } from './types'
import {
  HJEMFLYT_PRESET_TASKS,
  hjemflytTaskTitleExists,
  presetsGroupedByCategory,
  type HjemflytPresetTask,
} from './hjemflytPresetTasks'

type Props = {
  tasks: HjemflytTask[]
  onAddPreset: (title: string, rewardPoints: number | null) => { ok: boolean }
  onFeedback: (message: string | null) => void
}

function parsePresetRewardDraft(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Math.max(0, Math.round(Number(t.replace(',', '.')) || 0))
  if (n === 0) return null
  return Math.min(1_000_000, n)
}

export function HjemflytPresetSection({ tasks, onAddPreset, onFeedback }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [rewardDraftByKey, setRewardDraftByKey] = useState<Record<string, string>>({})
  const [lastResult, setLastResult] = useState<string | null>(null)

  const groups = useMemo(() => presetsGroupedByCategory(), [])

  const toggleKey = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const selectAllInCategory = useCallback((catTasks: readonly HjemflytPresetTask[]) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const t of catTasks) next.add(t.presetKey)
      return next
    })
  }, [])

  const onAddSelected = useCallback(() => {
    onFeedback(null)
    if (selectedKeys.size === 0) {
      setLastResult('Velg minst ett forslag.')
      return
    }
    let added = 0
    let skipped = 0
    const titlesSnapshot = tasks.map((t) => ({ title: t.title }))
    for (const key of selectedKeys) {
      const preset = HJEMFLYT_PRESET_TASKS.find((p) => p.presetKey === key)
      if (!preset) continue
      if (hjemflytTaskTitleExists(preset.title, titlesSnapshot)) {
        skipped++
        continue
      }
      const rewardPoints = parsePresetRewardDraft(rewardDraftByKey[key] ?? '')
      const r = onAddPreset(preset.title, rewardPoints)
      if (r.ok) {
        added++
        titlesSnapshot.push({ title: preset.title })
      }
    }
    setSelectedKeys(new Set())
    setRewardDraftByKey((prev) => {
      const next = { ...prev }
      for (const key of selectedKeys) delete next[key]
      return next
    })
    setLastResult(
      added === 0 && skipped > 0
        ? `Ingen nye oppgaver: ${skipped} finnes allerede (samme tittel).`
        : skipped > 0
          ? `${added} lagt til · ${skipped} hoppet over (finnes fra før).`
          : `${added} ${added === 1 ? 'oppgave lagt til' : 'oppgaver lagt til'}.`,
    )
  }, [onAddPreset, onFeedback, rewardDraftByKey, selectedKeys, tasks])

  return (
    <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      <div>
        <h3 className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Vanlige oppgaver (forslag)
        </h3>
        <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
          Kryss av, fyll inn poeng per rad hvis du vil (tomt = ingen poeng), og legg til. Du kan slette eller endre
          senere. Oppgaver med samme tittel som allerede finnes hoppes over.
        </p>
      </div>
      <div className="space-y-2">
        {groups.map(({ category, tasks: catTasks }) => (
          <details
            key={category}
            className="rounded-xl border overflow-hidden min-w-0"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <summary
              className="px-3 py-3 text-sm font-medium cursor-pointer list-none flex items-center justify-between gap-2 min-h-[44px] touch-manipulation [&::-webkit-details-marker]:hidden"
              style={{ color: 'var(--text)' }}
            >
              <span className="min-w-0 break-words">{category}</span>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                {catTasks.length}
              </span>
            </summary>
            <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => selectAllInCategory(catTasks)}
                className="mt-2 text-xs font-medium min-h-[44px] px-2 py-2 rounded-lg touch-manipulation w-full sm:w-auto text-left"
                style={{ color: 'var(--primary)', background: 'var(--primary-pale)' }}
              >
                Velg alle i kategorien
              </button>
              <ul className="space-y-3">
                {catTasks.map((p) => (
                  <li
                    key={p.presetKey}
                    className="rounded-lg px-1 py-1 min-w-0"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
                      <label className="flex items-start gap-3 text-sm cursor-pointer min-h-[44px] py-1 touch-manipulation flex-1 min-w-0">
                        <input
                          type="checkbox"
                          className="mt-1.5 shrink-0"
                          checked={selectedKeys.has(p.presetKey)}
                          onChange={() => toggleKey(p.presetKey)}
                        />
                        <span className="min-w-0 break-words" style={{ color: 'var(--text)' }}>
                          {p.title}
                        </span>
                      </label>
                      <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0 sm:w-36">
                        <label
                          className="text-xs font-medium whitespace-nowrap"
                          style={{ color: 'var(--text-muted)' }}
                          htmlFor={`hf-preset-pts-${p.presetKey}`}
                        >
                          Poeng
                        </label>
                        <input
                          id={`hf-preset-pts-${p.presetKey}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="—"
                          value={rewardDraftByKey[p.presetKey] ?? ''}
                          onChange={(e) =>
                            setRewardDraftByKey((prev) => ({ ...prev, [p.presetKey]: e.target.value }))
                          }
                          className="w-full min-w-0 min-h-[44px] rounded-xl border px-3 text-sm"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddSelected}
        className="w-full min-h-[44px] px-4 rounded-xl text-sm font-medium touch-manipulation"
        style={{ background: 'var(--primary)', color: 'white' }}
      >
        Legg til valgte
      </button>
      {lastResult && (
        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          {lastResult}
        </p>
      )}
    </div>
  )
}
