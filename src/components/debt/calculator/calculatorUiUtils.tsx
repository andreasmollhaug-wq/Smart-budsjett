'use client'

import type { ReactNode } from 'react'

export function clampCalculator(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function formatRateNb(value: number): string {
  return `${value.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

export function IconStepButton({
  onClick,
  disabled,
  children,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full border touch-manipulation disabled:opacity-40"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
    >
      {children}
    </button>
  )
}

export const CALCULATOR_CARD_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
} as const

export const SCHEDULE_VIRTUAL_THRESHOLD = 120
