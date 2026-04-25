'use client'

import { useCallback, type CSSProperties } from 'react'
import { formatMoneyInputFromNumber, parsePositiveMoneyAmount2Decimals } from '@/lib/money/parseNorwegianAmount'
import { useFormattedMoneyInput } from '@/lib/useFormattedMoneyInput'
import type { PersonProfile } from '@/lib/store'
import type { HouseholdSplitMode } from '@/lib/householdBudgetSplit'

function HouseholdSplitAmountField({
  value,
  onValueChange,
  onBlur,
  'aria-label': ariaLabel,
  className,
  style,
}: {
  value: string
  onValueChange: (v: string) => void
  onBlur: () => void
  'aria-label': string
  className: string
  style: CSSProperties
}) {
  const setVal = useCallback(
    (v: string) => {
      onValueChange(v)
    },
    [onValueChange],
  )
  const field = useFormattedMoneyInput(value, setVal)
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={field.onChange}
      onBlur={onBlur}
      className={className}
      style={style}
      aria-label={ariaLabel}
    />
  )
}

export type HouseholdSplitFormState = {
  enabled: boolean
  participantIds: string[]
  mode: HouseholdSplitMode
  /** profilId -> percent string (nb) */
  percentByProfileId: Record<string, string>
  /** profilId -> beløp string for like andeler (referanse) */
  amountByProfileId: Record<string, string>
}

type Props = {
  profiles: PersonProfile[]
  value: HouseholdSplitFormState
  onChange: (next: HouseholdSplitFormState) => void
}

export function createDefaultHouseholdSplitForm(profiles: PersonProfile[]): HouseholdSplitFormState {
  const ids = profiles.map((p) => p.id).sort()
  const percentByProfileId: Record<string, string> = {}
  const amountByProfileId: Record<string, string> = {}
  if (ids.length >= 2) {
    const each = (100 / ids.length).toFixed(1)
    for (const id of ids) {
      percentByProfileId[id] = each
      amountByProfileId[id] = ''
    }
  }
  return {
    enabled: false,
    participantIds: ids,
    mode: 'equal',
    percentByProfileId,
    amountByProfileId,
  }
}

export default function HouseholdBudgetSplitSection({ profiles, value, onChange }: Props) {
  if (profiles.length < 2) return null

  const toggleParticipant = (id: string) => {
    const set = new Set(value.participantIds)
    if (set.has(id)) {
      if (set.size <= 2) return
      set.delete(id)
    } else {
      set.add(id)
    }
    const nextIds = [...set].sort()
    onChange({ ...value, participantIds: nextIds })
  }

  const setMode = (mode: HouseholdSplitMode) => {
    onChange({ ...value, mode })
  }

  const setPercent = (id: string, s: string) => {
    onChange({
      ...value,
      percentByProfileId: { ...value.percentByProfileId, [id]: s.replace(/[^\d.,]/g, '') },
    })
  }

  const setAmount = (id: string, s: string) => {
    onChange({
      ...value,
      amountByProfileId: { ...value.amountByProfileId, [id]: s },
    })
  }

  const onAmountBlur = (id: string) => {
    const raw = value.amountByProfileId[id] ?? ''
    const n = parsePositiveMoneyAmount2Decimals(raw)
    if (!Number.isFinite(n)) return
    onChange({
      ...value,
      amountByProfileId: { ...value.amountByProfileId, [id]: formatMoneyInputFromNumber(n) },
    })
  }

  return (
    <div
      className="rounded-xl px-3 py-3 space-y-3 mt-3"
      style={{ background: 'var(--primary-pale)', border: '1px solid var(--accent)' }}
    >
      <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="mt-1 h-4 w-4 rounded shrink-0"
        />
        <span className="text-sm leading-snug min-w-0" style={{ color: 'var(--text)' }}>
          <strong>Felles husholdning</strong> — fordel beløpet på valgte profiler (totalt vises som sum i
          husholdning).
        </span>
      </label>

      {value.enabled && (
        <div className="space-y-3 pl-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Hvem skal linjen fordeles mellom?
          </p>
          <ul className="space-y-2">
            {profiles.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.participantIds.includes(p.id)}
                    onChange={() => toggleParticipant(p.id)}
                    className="h-4 w-4 rounded shrink-0"
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    {p.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Fordeling
            </span>
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              {(['equal', 'percent', 'amount'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium touch-manipulation"
                  style={{
                    border: `1px solid var(--border)`,
                    background: value.mode === m ? 'var(--primary)' : 'var(--surface)',
                    color: value.mode === m ? 'white' : 'var(--text)',
                  }}
                >
                  {m === 'equal' ? 'Lik' : m === 'percent' ? 'Prosent' : 'Kroner'}
                </button>
              ))}
            </div>
          </div>

          {value.mode === 'percent' && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Prosent per person (skal sum til 100).
              </p>
              {value.participantIds.map((pid) => {
                const pr = profiles.find((x) => x.id === pid)
                if (!pr) return null
                return (
                  <div
                    key={pid}
                    className="grid min-w-0 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(6rem,10rem)] gap-1 sm:gap-3 sm:items-center"
                  >
                    <span className="text-sm min-w-0 truncate" style={{ color: 'var(--text)' }}>
                      {pr.name}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value.percentByProfileId[pid] ?? ''}
                      onChange={(e) => setPercent(pid, e.target.value)}
                      className="w-full min-w-0 min-h-[44px] px-3 py-2 text-sm rounded-xl touch-manipulation"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      aria-label={`Prosent for ${pr.name}`}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {value.mode === 'amount' && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Skriv andelsbeløp per person — fordelingen brukes likt hver måned. Summen av delbeløpene må samsvare
                med beløpet du skrev over (samme hovedbeløp).
              </p>
              {value.participantIds.map((pid) => {
                const pr = profiles.find((x) => x.id === pid)
                if (!pr) return null
                return (
                  <div
                    key={pid}
                    className="grid min-w-0 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(6rem,10rem)] gap-1 sm:gap-3 sm:items-center"
                  >
                    <span className="text-sm min-w-0 truncate" style={{ color: 'var(--text)' }}>
                      {pr.name}
                    </span>
                    <HouseholdSplitAmountField
                      value={value.amountByProfileId[pid] ?? ''}
                      onValueChange={(v) => setAmount(pid, v)}
                      onBlur={() => onAmountBlur(pid)}
                      className="w-full min-w-0 min-h-[44px] px-3 py-2 text-sm rounded-xl touch-manipulation"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      aria-label={`Kroner for ${pr.name}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
