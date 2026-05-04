'use client'

import { type ReactNode, useEffect } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'

export type RenovationModalMaxWidth = 'md' | 'lg' | 'xl'

const maxWClass: Record<RenovationModalMaxWidth, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

/** Hovedscrollbar i oppussingsmodaler — touch/overscroll-optimalisert. */
export const renovationModalScrollableMainClass =
  'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y min-w-0 p-4 sm:p-5'

/** Ekstra nedre luft ved kun scrollfelt (ingen fast fot med knapper). */
export const renovationModalScrollbarSafeBottom =
  'pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))]'

/** Fot med lukk/handlingsknapper — trygg avstand til hjem‑indikator. */
export const renovationModalFooterClass =
  'shrink-0 border-t p-4 sm:p-5 pb-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))]'

export default function RenovationModalFrame({
  onRequestClose,
  ariaLabelledBy,
  maxWidth = 'lg',
  panelClassName = '',
  /** For `aria-controls` fra triggerknapp til dialogrot. */
  rootElementId,
  children,
}: {
  onRequestClose: () => void
  ariaLabelledBy: string
  maxWidth?: RenovationModalMaxWidth
  panelClassName?: string
  rootElementId?: string
  children: ReactNode
}) {
  const backdropDismiss = useModalBackdropDismiss(onRequestClose)

  useEffect(() => {
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : ''
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prev
      }
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRequestClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onRequestClose])

  return (
    <div
      id={rootElementId}
      className={`fixed inset-0 z-[100] flex flex-col items-stretch justify-end px-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center sm:p-6`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <div
        {...backdropDismiss}
        className="absolute inset-0 bg-black/40 touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-hidden
      />
      <div
        className={`relative z-[1] mx-auto mt-auto flex max-h-[min(92vh,92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] w-full ${maxWClass[maxWidth]} min-h-0 flex-col overflow-hidden rounded-t-2xl shadow-xl min-w-0 sm:mt-0 sm:max-h-[min(85vh,88dvh)] sm:rounded-2xl ${panelClassName}`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
