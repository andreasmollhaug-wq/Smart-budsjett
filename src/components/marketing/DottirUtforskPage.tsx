'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import LandingFooter from '@/components/marketing/LandingFooter'
import BrandLogoMark from '@/components/brand/BrandLogoMark'
import { CTA_HREF, DOTTIR_HOME_HREF, landingHorizontalPadding } from '@/components/marketing/constants'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'
import {
  DOTTIR_SHOWCASE_CATEGORIES,
  DOTTIR_SHOWCASE_MODULES,
  type DottirShowcaseCategoryId,
  type DottirShowcaseModule,
} from '@/components/marketing/dottirModuleShowcaseData'

export default function DottirUtforskPage() {
  const [category, setCategory] = useState<DottirShowcaseCategoryId>('alle')

  const visible = useMemo(() => {
    if (category === 'alle') return DOTTIR_SHOWCASE_MODULES
    return DOTTIR_SHOWCASE_MODULES.filter((m) => m.category === category)
  }, [category])

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
        <section className={`relative overflow-x-hidden pb-10 pt-10 sm:pb-14 sm:pt-14 ${landingHorizontalPadding}`}>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(165deg, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 45%), radial-gradient(ellipse 90% 55% at 20% 10%, rgba(112, 72, 232, 0.13), transparent)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
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
              className="mt-6 text-balance text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl md:leading-[1.08]"
              style={{ color: 'var(--text)' }}
            >
              Alt du får — på én{' '}
              <span
                className="bg-clip-text pb-0.5 text-transparent md:pb-1"
                style={{
                  backgroundImage: 'linear-gradient(115deg, #3B5BDB 0%, #7048E8 50%, #4C6EF5 100%)',
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
              Økonomi, hverdag og innsikt som henger sammen. Trykk på et kort for mer — eller filtrer om du vil dykke i én
              type retning først.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={CTA_HREF}
                className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                style={{ background: 'var(--primary)' }}
              >
                Kom i gang
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className={`border-t pb-16 pt-2 sm:pb-20 ${landingHorizontalPadding}`} style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto max-w-5xl min-w-0">
            <div
              className="flex min-w-0 flex-wrap gap-2 sm:gap-3"
              role="group"
              aria-label="Filtrer moduler"
            >
              {DOTTIR_SHOWCASE_CATEGORIES.map((c) => {
                const selected = category === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(c.id)}
                    className="min-h-[44px] touch-manipulation rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors sm:py-2"
                    style={{
                      borderColor: selected
                        ? 'color-mix(in srgb, var(--primary) 45%, var(--border))'
                        : 'var(--border)',
                      background: selected ? 'var(--primary-pale)' : 'var(--surface)',
                      color: selected ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>

            <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Viser {visible.length} {visible.length === 1 ? 'modul' : 'moduler'}
              {category !== 'alle' ? ` · ${DOTTIR_SHOWCASE_CATEGORIES.find((c) => c.id === category)?.label}` : ''}
            </p>

            <ul className="mt-8 grid min-w-0 list-none gap-4 sm:grid-cols-2 sm:gap-5">
              {visible.map((m) => (
                <li key={m.href} className="min-w-0">
                  <ModuleCard module={m} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>

      <LandingFooter variant="dottir" />
    </div>
  )
}

function ModuleCard({ module }: { module: DottirShowcaseModule }) {
  const Icon = module.icon
  return (
    <details
      className="group min-w-0 rounded-2xl border shadow-sm transition-shadow open:shadow-md"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <summary className="flex min-w-0 cursor-pointer list-none touch-manipulation items-start gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--primary-pale)' }}
        >
          <Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-base font-bold leading-snug sm:text-lg" style={{ color: 'var(--text)' }}>
            {module.label}
          </h2>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {module.hook}
          </p>
        </div>
        <ChevronDown
          className="mt-1 h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden
        />
      </summary>
      <div className="border-t px-4 pb-5 pt-2 sm:px-5" style={{ borderColor: 'var(--border)' }}>
        <dl className="space-y-3 text-sm leading-relaxed">
          <div>
            <dt className="font-bold" style={{ color: 'var(--text)' }}>
              Hva
            </dt>
            <dd className="mt-1" style={{ color: 'var(--text-muted)' }}>
              {module.what}
            </dd>
          </div>
          <div>
            <dt className="font-bold" style={{ color: 'var(--text)' }}>
              Når
            </dt>
            <dd className="mt-1" style={{ color: 'var(--text-muted)' }}>
              {module.when}
            </dd>
          </div>
          <div>
            <dt className="font-bold" style={{ color: 'var(--text)' }}>
              Utfall
            </dt>
            <dd className="mt-1" style={{ color: 'var(--text-muted)' }}>
              {module.outcome}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={module.href}
            className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
          >
            Åpne i appen
          </Link>
          <p className="min-w-0 flex-1 basis-full text-xs leading-relaxed sm:basis-auto sm:flex-none" style={{ color: 'var(--text-muted)' }}>
            Krever innlogging. Du blir eventuelt sendt til innlogging først.
          </p>
        </div>
      </div>
    </details>
  )
}
