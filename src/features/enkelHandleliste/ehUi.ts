/**
 * Delte design-tokens og klassestrenger for «Enkel handleliste».
 * Holder uttrykket konsistent (kort, knapper, skygger) på tvers av modulen.
 */
import type { CSSProperties } from 'react'

/** Myk, rolig kort-skygge i app-stil. */
export const EH_CARD_SHADOW =
  '0 1px 2px rgba(30,43,79,0.04), 0 4px 14px rgba(30,43,79,0.06)'

export const EH_FLOAT_SHADOW =
  '0 2px 8px rgba(30,43,79,0.08), 0 12px 30px rgba(30,43,79,0.14)'

export const ehCardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  boxShadow: EH_CARD_SHADOW,
}

/** Primær CTA — gradient som resten av appen. */
export const ehPrimaryBtnClass =
  'inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40'

export const ehPrimaryBtnStyle: CSSProperties = {
  background: 'var(--cta-gradient)',
  boxShadow: '0 6px 16px color-mix(in srgb, var(--primary) 32%, transparent)',
}

/** Sekundærknapp — lys flate med ramme. */
export const ehSecondaryBtnClass =
  'inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition-[transform,opacity] active:scale-[0.98] disabled:opacity-40'

export const ehSecondaryBtnStyle: CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
}

/** Rund ikonknapp (header, lukk osv.). */
export const ehIconBtnClass =
  'inline-flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-2xl border transition-[transform,opacity] active:scale-[0.96]'

export const ehIconBtnStyle: CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
}
