'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  disabled: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  categoryLabel: string
  onMoveUp: () => void
  onMoveDown: () => void
}

/** Diskrete opp/ned-knapper for rekkefølge innenfor samme budsjetthovedgruppe. */
export default function BudgetLineReorderButtons({
  disabled,
  canMoveUp,
  canMoveDown,
  categoryLabel,
  onMoveUp,
  onMoveDown,
}: Props) {
  if (disabled) return null

  /** Samme kompakte stil som +/- ved siden av linjenavn på budsjett (jf. transaksjoner «Faktisk oversikt»-rader). */
  const btn =
    'inline-flex items-center justify-center p-0.5 rounded shrink-0 opacity-45 hover:opacity-80 disabled:opacity-20 disabled:pointer-events-none touch-manipulation'

  return (
    <div
      className="inline-flex flex-row items-center gap-px leading-none"
      role="group"
      aria-label={`Rekkefølge for ${categoryLabel}`}
    >
      <button
        type="button"
        className={btn}
        style={{ color: 'var(--text-muted)' }}
        disabled={!canMoveUp}
        onClick={onMoveUp}
        aria-label={`Flytt ${categoryLabel} opp`}
      >
        <ChevronUp size={12} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className={btn}
        style={{ color: 'var(--text-muted)' }}
        disabled={!canMoveDown}
        onClick={onMoveDown}
        aria-label={`Flytt ${categoryLabel} ned`}
      >
        <ChevronDown size={12} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
