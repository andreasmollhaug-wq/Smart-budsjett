'use client'

import type { ReactNode } from 'react'
import type { EhSettings } from '@/features/enkelHandleliste/types'
import { EhSheet } from '@/features/enkelHandleliste/components/EhSheet'

function EhToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[56px] w-full touch-manipulation items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-colors active:scale-[0.99]"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
            {description}
          </span>
        )}
      </span>
      <span
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors"
        style={{ background: checked ? 'var(--primary)' : 'var(--border)' }}
      >
        <span
          className="absolute h-5 w-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(25px)' : 'translateX(3px)' }}
        />
      </span>
    </button>
  )
}

export function EnkelHandlelisteSettingsModal({
  open,
  settings,
  groups,
  familyEnabled = false,
  onClose,
  onSave,
}: {
  open: boolean
  settings: EhSettings
  groups: { id: string; name: string }[]
  familyEnabled?: boolean
  onClose: () => void
  onSave: (patch: Partial<EhSettings>) => void
}) {
  const rows: ReactNode[] = [
    <EhToggleRow
      key="cap"
      label="Stor forbokstav"
      description="Nye varer får stor forbokstav på hvert ord"
      checked={settings.capitalizeWords}
      onChange={(v) => onSave({ capitalizeWords: v })}
    />,
    <EhToggleRow
      key="qty"
      label="Vis antall"
      description="Vis × antall på varene"
      checked={settings.showQuantity}
      onChange={(v) => onSave({ showQuantity: v })}
    />,
    <EhToggleRow
      key="shake"
      label="Rist for å rydde"
      description="Rist telefonen for å flytte ferdige varer nederst"
      checked={settings.shakeToSortEnabled}
      onChange={(v) => onSave({ shakeToSortEnabled: v })}
    />,
  ]

  if (familyEnabled) {
    rows.push(
      <EhToggleRow
        key="initials"
        label="Vis hvem som la til"
        description="Initialer på varer andre i husstanden har lagt til"
        checked={settings.showContributorInitials}
        onChange={(v) => onSave({ showContributorInitials: v })}
      />,
    )
  }

  return (
    <EhSheet open={open} onClose={onClose} title="Innstillinger">
      <div className="space-y-2.5 pb-4">
        {rows}
        {groups.length > 0 && (
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Standard gruppe for nye lister
            </label>
            <select
              className="min-h-[48px] w-full rounded-xl border px-3 text-[15px]"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
              value={settings.defaultGroupId ?? ''}
              onChange={(e) => onSave({ defaultGroupId: e.target.value || null })}
            >
              <option value="">Ingen</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </EhSheet>
  )
}
