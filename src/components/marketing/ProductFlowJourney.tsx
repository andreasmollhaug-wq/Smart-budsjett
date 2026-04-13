'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, ChevronDown } from 'lucide-react'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { CTA_HREF } from './constants'
import { PRODUCT_FLOW_PHASES, type ProductFlowPhase } from './productFlowContent'

function PhaseCard({ phase, index }: { phase: ProductFlowPhase; index: number }) {
  const { ref, visible } = useRevealOnScroll()
  const Icon = phase.icon

  return (
    <article
      ref={ref}
      id={phase.id}
      className={`relative scroll-mt-28 pl-12 transition-all duration-500 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0 sm:scroll-mt-24 sm:pl-14 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div
        className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm"
        style={{
          background: 'var(--surface)',
          border: `2px solid ${phase.accent}`,
          color: phase.accent,
        }}
        aria-hidden
      >
        {index + 1}
      </div>

      <div
        className="min-w-0 rounded-2xl p-4 sm:p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-wrap items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, ${phase.accent}, ${phase.accent}cc)` }}
            aria-hidden
          >
            <Icon size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug sm:text-lg" style={{ color: 'var(--text)' }}>
              {phase.title}
            </h2>
            <p
              className="mt-2 break-words text-sm font-semibold leading-relaxed"
              style={{ color: 'var(--primary)' }}
            >
              {phase.outcome}
            </p>
          </div>
        </div>

        <p className="mt-4 break-words text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {phase.lead}
        </p>

        <ul className="mt-4 space-y-2 text-sm leading-relaxed list-disc pl-5" style={{ color: 'var(--text)' }}>
          {phase.bullets.map((b, bi) => (
            <li key={bi}>{b}</li>
          ))}
        </ul>

        {phase.householdNote ? (
          <div
            className="mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--text)' }}>
              Familie og husholdning:{' '}
            </span>
            {phase.householdNote}
          </div>
        ) : null}

        <p
          className="mt-5 text-xs leading-relaxed rounded-xl px-3 py-2.5"
          style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
        >
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            Vanlig fallgruve:{' '}
          </span>
          {phase.pitfall}
        </p>

        {phase.expandedParagraphs && phase.expandedParagraphs.length > 0 ? (
          <details className="group mt-5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium outline-none transition-colors hover:opacity-90 touch-manipulation [&::-webkit-details-marker]:hidden sm:min-h-[44px]">
              <span style={{ color: 'var(--text)' }}>Utvidet informasjon</span>
              <ChevronDown
                size={18}
                className="shrink-0 transition-transform group-open:rotate-180"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden
              />
            </summary>
            <div className="border-t px-4 pb-4 pt-2 text-sm leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              {phase.expandedParagraphs.map((p, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : undefined}>
                  {p}
                </p>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </article>
  )
}

export default function ProductFlowJourney() {
  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-8">
      <header
        className="overflow-hidden rounded-2xl p-4 sm:p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p
          className="mb-2 animate-[komIgangHero_0.55s_ease-out_both] text-xs font-medium uppercase tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          Din flyt i Smart Budsjett
        </p>
        <h2
          className="animate-[komIgangHero_0.55s_ease-out_both] text-xl font-semibold sm:text-2xl"
          style={{ color: 'var(--text)', animationDelay: '70ms' }}
        >
          Fra plan til oversikt — steg for steg
        </h2>
        <p
          className="mt-3 max-w-2xl animate-[komIgangHero_0.55s_ease-out_both] text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)', animationDelay: '140ms' }}
        >
          Dette er en oversikt du kan lese før du logger inn. Når du har konto, finner du den utvidede steg-for-steg-guiden
          under <span className="font-medium" style={{ color: 'var(--text)' }}>Min konto → Kom i gang</span> — med lenker rett inn i
          appen.
        </p>

        <div className="mt-5 min-w-0 animate-[komIgangHero_0.55s_ease-out_both]" style={{ animationDelay: '210ms' }}>
          <nav
            className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden px-1 pb-2 pt-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0"
            style={{ scrollbarColor: 'var(--accent) transparent' }}
            aria-label="Hurtiglenker til steg"
          >
            {PRODUCT_FLOW_PHASES.map((p, i) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="inline-flex min-h-[48px] max-w-[min(100%,16rem)] shrink-0 snap-start touch-manipulation items-center rounded-full border px-4 py-2 text-xs font-medium transition-colors active:opacity-90 sm:min-h-0 sm:max-w-none sm:shrink sm:px-3 sm:py-1.5"
                style={{
                  background: 'var(--primary-pale)',
                  color: 'var(--primary)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="line-clamp-2 text-left leading-snug sm:line-clamp-none sm:truncate">
                  {i + 1}. {p.shortTitle}
                </span>
              </a>
            ))}
          </nav>
          <p className="mt-1 text-xs sm:hidden" style={{ color: 'var(--text-muted)' }}>
            Sveip sidelengs for alle steg — eller scroll nedover.
          </p>
        </div>

        <p
          className="mt-4 hidden animate-[komIgangHero_0.55s_ease-out_both] items-center gap-2 text-xs sm:flex"
          style={{ color: 'var(--text-muted)', animationDelay: '280ms' }}
        >
          <ArrowDown size={14} className="shrink-0" aria-hidden />
          Scroll nedover — hvert steg vises når det kommer inn i skjermen.
        </p>
      </header>

      <div className="relative min-w-0">
        <div
          className="pointer-events-none absolute bottom-8 left-[19px] top-8 w-0.5 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, var(--primary), var(--accent))',
            opacity: 0.45,
          }}
          aria-hidden
        />

        <div className="space-y-10 sm:space-y-12">
          {PRODUCT_FLOW_PHASES.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:items-center sm:flex-row sm:flex-wrap">
        <Link
          href={CTA_HREF}
          className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-[44px] sm:w-auto"
          style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
        >
          Start gratis prøveperiode
          <ArrowRight size={18} aria-hidden />
        </Link>
        <p className="text-center text-xs sm:max-w-none sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          14 dagers prøveperiode — deretter betaling om du fortsetter.
        </p>
      </div>
    </div>
  )
}
