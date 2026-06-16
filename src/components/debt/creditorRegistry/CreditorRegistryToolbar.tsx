'use client'

import { useId } from 'react'
import {
  inferSortPreset,
  REGISTRY_SORT_LABELS,
  REGISTRY_SORT_PRESETS,
  sortPrefsFromPreset,
  type RegistrySortPreset,
} from '@/lib/creditorRegistry/sort'
import type { CreditorRegistryPrefs } from '@/lib/creditorRegistry/types'

type Props = {
  prefs: CreditorRegistryPrefs
  readOnly: boolean
  onPrefsChange: (patch: Partial<CreditorRegistryPrefs>) => void
  onAddCreditor: () => void
}

export default function CreditorRegistryToolbar({
  prefs,
  readOnly,
  onPrefsChange,
  onAddCreditor,
}: Props) {
  const sortId = useId()
  const sortPreset = inferSortPreset(prefs.creditorSort, prefs.loanSort)

  const selectClass =
    'min-h-[44px] min-w-0 flex-1 rounded-xl px-3 py-2.5 text-base touch-manipulation sm:text-sm'
  const selectStyle = {
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
  } as const

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex w-full min-w-0 items-center gap-2 sm:max-w-sm sm:flex-1">
        <label htmlFor={sortId} className="shrink-0 text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          Sorter
        </label>
        <select
          id={sortId}
          value={sortPreset}
          onChange={(e) => {
            const next = sortPrefsFromPreset(e.target.value as RegistrySortPreset)
            onPrefsChange(next)
          }}
          className={selectClass}
          style={selectStyle}
          aria-label="Sorter oversikt gjeld"
        >
          {REGISTRY_SORT_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {REGISTRY_SORT_LABELS[preset]}
            </option>
          ))}
        </select>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={onAddCreditor}
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl px-5 text-sm font-medium text-white touch-manipulation shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          Legg til kreditor
        </button>
      )}
    </div>
  )
}
