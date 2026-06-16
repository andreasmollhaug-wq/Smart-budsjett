'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import {
  getLandingPlanDetails,
  type LandingPlanDetailContent,
} from '@/components/marketing/landingPricingPlanDetails'
import type { LandingPlanId } from '@/components/marketing/landingPricingPlans'

const MODAL_Z = 210

type Props = {
  planId: LandingPlanId | null
  onClose: () => void
}

function PlanInfoBody({ content }: { content: LandingPlanDetailContent }) {
  return (
    <>
      <p className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
        {content.intro}
      </p>
      <p
        className="mt-4 rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed"
        style={{
          borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--border))',
          background: 'color-mix(in srgb, var(--primary-pale) 40%, var(--surface))',
          color: 'var(--text)',
        }}
      >
        {content.profileHighlight}
      </p>
      <div className="mt-6 space-y-6">
        {content.sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold sm:text-base" style={{ color: 'var(--text)' }}>
              {section.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex min-w-0 gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
        {content.footnote}
      </p>
    </>
  )
}

export default function DottirLandingV2PlanInfoModal({ planId, onClose }: Props) {
  const content = planId ? getLandingPlanDetails(planId) : null

  useEffect(() => {
    if (!planId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [planId, onClose])

  if (!planId || !content) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: MODAL_Z }}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 touch-manipulation bg-black/50"
        aria-label="Lukk planinformasjon"
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.preventDefault()
          onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dottir-plan-info-title"
        className="relative z-10 flex max-h-[min(92dvh,42rem)] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:max-w-lg sm:rounded-2xl"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 id="dottir-plan-info-title" className="text-lg font-bold sm:text-xl" style={{ color: 'var(--text)' }}>
            {content.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-opacity hover:opacity-90"
            style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          <PlanInfoBody content={content} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
