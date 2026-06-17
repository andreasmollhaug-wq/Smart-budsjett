'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Sparkles } from 'lucide-react'
import LandingFooter from '@/components/marketing/LandingFooter'
import DottirModuleInfoModal from '@/components/marketing/DottirModuleInfoModal'
import BrandLogoMark from '@/components/brand/BrandLogoMark'
import { CTA_HREF, DOTTIR_HOME_HREF, landingHorizontalPadding } from '@/components/marketing/constants'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'
import {
  DOTTIR_SHOWCASE_CATEGORIES,
  DOTTIR_SHOWCASE_MODULES,
  type DottirShowcaseCategoryId,
  type DottirShowcaseModule,
} from '@/components/marketing/dottirModuleShowcaseData'

const AREA_COUNT = DOTTIR_SHOWCASE_CATEGORIES.filter((c) => c.id !== 'alle').length

function countForCategory(id: DottirShowcaseCategoryId): number {
  if (id === 'alle') return DOTTIR_SHOWCASE_MODULES.length
  return DOTTIR_SHOWCASE_MODULES.filter((m) => m.category === id).length
}

export default function DottirUtforskPage() {
  const [category, setCategory] = useState<DottirShowcaseCategoryId>('alle')
  const [activeHref, setActiveHref] = useState<string | null>(null)

  const visible = useMemo(() => {
    if (category === 'alle') return DOTTIR_SHOWCASE_MODULES
    return DOTTIR_SHOWCASE_MODULES.filter((m) => m.category === category)
  }, [category])

  const activeIndex = useMemo(
    () => (activeHref ? visible.findIndex((m) => m.href === activeHref) : -1),
    [activeHref, visible],
  )
  const activeModule: DottirShowcaseModule | null = activeIndex >= 0 ? visible[activeIndex] : null

  const closeModal = useCallback(() => setActiveHref(null), [])
  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActiveHref(visible[activeIndex - 1].href)
  }, [activeIndex, visible])
  const goNext = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < visible.length - 1) setActiveHref(visible[activeIndex + 1].href)
  }, [activeIndex, visible])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--surface) 93%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className={`mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-3 py-3 sm:py-4 ${landingHorizontalPadding}`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href={DOTTIR_HOME_HREF}
              aria-label={PRODUCT_DISPLAY_NAME}
              className="inline-flex shrink-0 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            >
              <BrandLogoMark heightClass="h-10 w-auto" alt="" />
            </Link>
            <p className="min-w-0 truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
              Utforsk alt
            </p>
          </div>
          <Link
            href={DOTTIR_HOME_HREF}
            className="inline-flex min-h-[44px] shrink-0 touch-manipulation items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Tilbake til Dottir</span>
            <span className="sm:hidden">Tilbake</span>
          </Link>
        </div>
      </header>

      <article>
        <section className={`relative overflow-x-hidden pb-12 pt-12 sm:pb-16 sm:pt-16 ${landingHorizontalPadding}`}>
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(165deg, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 48%), radial-gradient(ellipse 90% 55% at 18% 8%, color-mix(in srgb, var(--primary-light) 22%, transparent), transparent)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.4]"
              style={{
                backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
                maskImage: 'linear-gradient(180deg, black 0%, transparent 85%)',
                WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 85%)',
              }}
            />
          </div>
          <div className="relative mx-auto max-w-4xl min-w-0 text-center">
            <p
              className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-3 py-2 text-center text-xs font-semibold shadow-sm sm:px-4 sm:py-1.5 sm:text-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 30%, var(--border))',
                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                color: 'var(--text-muted)',
              }}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
              Alt samlet — uten støy
            </p>
            <h1
              className="mt-6 text-balance text-[1.85rem] font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl md:leading-[1.08]"
              style={{ color: 'var(--text)' }}
            >
              Alt du får — på én{' '}
              <span
                className="bg-clip-text pb-0.5 text-transparent md:pb-1"
                style={{
                  backgroundImage: 'var(--marketing-hero-heading-gradient)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                rolig flyt
              </span>
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              Økonomi, hverdag og innsikt som henger sammen. Trykk på en modul for å se hva den gjør, når du bruker den
              — og hva du sitter igjen med.
            </p>

            <dl className="mx-auto mt-9 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
              {[
                { value: DOTTIR_SHOWCASE_MODULES.length, label: 'moduler' },
                { value: AREA_COUNT, label: 'områder' },
                { value: 1, label: 'rolig flyt' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-2xl border px-2 py-3 shadow-sm sm:px-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-2xl font-bold leading-none sm:text-3xl" style={{ color: 'var(--primary)' }}>
                      {stat.value}
                    </span>
                    <span className="mt-1.5 block text-xs font-medium sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={CTA_HREF}
                className="inline-flex min-h-[48px] min-w-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                style={{ background: 'var(--primary)' }}
              >
                Kom i gang gratis
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section
          className={`border-t pb-20 pt-8 sm:pb-24 ${landingHorizontalPadding}`}
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="mx-auto max-w-5xl min-w-0">
            <div
              className="sticky top-[4.25rem] z-30 -mx-2 flex min-w-0 flex-nowrap gap-2 overflow-x-auto px-2 py-3 sm:flex-wrap sm:gap-3 sm:overflow-visible"
              role="group"
              aria-label="Filtrer moduler"
              style={{
                background: 'linear-gradient(180deg, var(--bg) 70%, transparent)',
              }}
            >
              {DOTTIR_SHOWCASE_CATEGORIES.map((c) => {
                const selected = category === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(c.id)}
                    className="inline-flex min-h-[44px] shrink-0 touch-manipulation items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors sm:py-2"
                    style={{
                      borderColor: selected
                        ? 'color-mix(in srgb, var(--primary) 45%, var(--border))'
                        : 'var(--border)',
                      background: selected ? 'var(--primary)' : 'var(--surface)',
                      color: selected ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {c.label}
                    <span
                      className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold"
                      style={{
                        background: selected ? 'rgba(255,255,255,0.22)' : 'var(--primary-pale)',
                        color: selected ? '#fff' : 'var(--primary)',
                      }}
                    >
                      {countForCategory(c.id)}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="mt-2 px-1 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Viser {visible.length} {visible.length === 1 ? 'modul' : 'moduler'}
              {category !== 'alle' ? ` · ${DOTTIR_SHOWCASE_CATEGORIES.find((c) => c.id === category)?.label}` : ''}
            </p>

            <ul className="mt-6 grid min-w-0 list-none gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {visible.map((m) => (
                <li key={m.href} className="min-w-0">
                  <ModuleCard module={m} onOpen={() => setActiveHref(m.href)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>

      <LandingFooter variant="dottir" />

      <DottirModuleInfoModal
        module={activeModule}
        position={activeModule ? { index: activeIndex, total: visible.length } : null}
        onClose={closeModal}
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex >= 0 && activeIndex < visible.length - 1}
      />
    </div>
  )
}

function ModuleCard({ module, onOpen }: { module: DottirShowcaseModule; onOpen: () => void }) {
  const Icon = module.icon
  const categoryName = DOTTIR_SHOWCASE_CATEGORIES.find((c) => c.id === module.category)?.label ?? ''
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full min-w-0 flex-col rounded-2xl border p-5 text-left shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      aria-label={`Mer om ${module.label}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ background: 'var(--primary-pale)' }}
        >
          <Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
            style={{ background: 'color-mix(in srgb, var(--primary-pale) 55%, var(--surface))', color: 'var(--primary)' }}
          >
            {categoryName}
          </span>
          <h2 className="mt-1.5 text-base font-bold leading-snug sm:text-lg" style={{ color: 'var(--text)' }}>
            {module.label}
          </h2>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {module.hook}
      </p>
      <span
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:gap-2.5"
        style={{ color: 'var(--primary)' }}
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        Les mer
      </span>
    </button>
  )
}
