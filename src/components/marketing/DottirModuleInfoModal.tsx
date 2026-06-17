'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Lightbulb, Sparkles, X } from 'lucide-react'
import { CTA_HREF } from '@/components/marketing/constants'
import {
  DOTTIR_SHOWCASE_CATEGORIES,
  type DottirShowcaseModule,
} from '@/components/marketing/dottirModuleShowcaseData'

/** Over sticky header (z-40) og i tråd med øvrige landing-modaler. */
const MODAL_Z = 210

type Props = {
  module: DottirShowcaseModule | null
  position?: { index: number; total: number } | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

function categoryLabel(id: DottirShowcaseModule['category']): string {
  return DOTTIR_SHOWCASE_CATEGORIES.find((c) => c.id === id)?.label ?? ''
}

export default function DottirModuleInfoModal({
  module,
  position,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: Props) {
  useEffect(() => {
    if (!module) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && hasPrev) onPrev?.()
      else if (event.key === 'ArrowRight' && hasNext) onNext?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [module, onClose, onPrev, onNext, hasPrev, hasNext])

  if (!module) return null

  const Icon = module.icon
  const sections = [
    { icon: Sparkles, label: 'Hva det er', text: module.what },
    { icon: Compass, label: 'Når du bruker det', text: module.when },
    { icon: Lightbulb, label: 'Hva du sitter igjen med', text: module.outcome },
  ]

  const navButtonClass =
    'flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-opacity disabled:cursor-default disabled:opacity-30'

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
      style={{ zIndex: MODAL_Z }}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 touch-manipulation bg-black/50 backdrop-blur-[2px]"
        aria-label="Lukk"
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.preventDefault()
          onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dottir-module-info-title"
        className="relative z-10 flex max-h-[min(92dvh,44rem)] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:max-w-lg sm:rounded-2xl"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="relative shrink-0 overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                'linear-gradient(150deg, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 70%)',
            }}
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
                style={{ background: 'var(--primary-pale)' }}
              >
                <Icon className="h-6 w-6" style={{ color: 'var(--primary)' }} aria-hidden />
              </span>
              <div className="min-w-0">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide"
                  style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                >
                  {categoryLabel(module.category)}
                </span>
                <h2
                  id="dottir-module-info-title"
                  className="mt-1.5 text-lg font-bold leading-tight sm:text-xl"
                  style={{ color: 'var(--text)' }}
                >
                  {module.label}
                </h2>
              </div>
            </div>
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          <p
            className="text-balance text-base font-semibold leading-snug sm:text-lg"
            style={{ color: 'var(--text)' }}
          >
            {module.hook}
          </p>

          <div className="mt-6 space-y-5">
            {sections.map(({ icon: SectionIcon, label, text }) => (
              <div key={label} className="flex min-w-0 gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'color-mix(in srgb, var(--primary-pale) 60%, var(--surface))' }}
                >
                  <SectionIcon className="h-4 w-4" style={{ color: 'var(--primary)' }} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold sm:text-base" style={{ color: 'var(--text)' }}>
                    {label}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              href={module.href}
              className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
              style={{ background: 'var(--primary)' }}
            >
              Åpne i appen
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              Kom i gang gratis
            </Link>
            <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Modulen krever innlogging. Du blir eventuelt sendt til innlogging først.
            </p>
          </div>
        </div>

        {(hasPrev || hasNext) && (
          <div
            className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 sm:px-6"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className={navButtonClass}
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              aria-label="Forrige modul"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            {position ? (
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {position.index + 1} av {position.total}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className={navButtonClass}
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              aria-label="Neste modul"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
