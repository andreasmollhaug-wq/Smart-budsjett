import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import DottirLandingV2ExpandableScreenshot from '@/components/marketing/DottirLandingV2ExpandableScreenshot'
import {
  V2_DIFFERENTIATOR_SECTION,
  V2_GUIDE_SECTION,
  V2_UNDERSTAND_SECTION,
} from '@/components/marketing/dottirLandingV2ContentData'
import { landingHorizontalPadding } from '@/components/marketing/constants'

export default function DottirLandingV2ContentSections() {
  return (
    <>
      <section
        id={V2_UNDERSTAND_SECTION.id}
        className={`scroll-mt-24 border-t py-10 sm:py-12 ${landingHorizontalPadding}`}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              {V2_UNDERSTAND_SECTION.headline}
            </h2>
            <ul className="mt-6 space-y-3">
              {V2_UNDERSTAND_SECTION.bullets.map((item) => (
                <li
                  key={item}
                  className="flex min-w-0 gap-2.5 text-sm leading-relaxed sm:text-base"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="min-w-0 overflow-hidden rounded-2xl border shadow-md"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <DottirLandingV2ExpandableScreenshot
              src={V2_UNDERSTAND_SECTION.screenshot.src}
              alt={V2_UNDERSTAND_SECTION.screenshot.alt}
              width={V2_UNDERSTAND_SECTION.screenshot.width}
              height={V2_UNDERSTAND_SECTION.screenshot.height}
            />
          </div>
        </div>
      </section>

      <section
        id={V2_DIFFERENTIATOR_SECTION.id}
        className={`scroll-mt-24 border-t py-10 sm:py-12 ${landingHorizontalPadding}`}
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
            {V2_DIFFERENTIATOR_SECTION.headline}
          </h2>
          <p className="mt-4 text-base font-medium sm:text-lg" style={{ color: 'var(--text)' }}>
            {V2_DIFFERENTIATOR_SECTION.lead}
          </p>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
            {V2_DIFFERENTIATOR_SECTION.body}
          </p>
        </div>
      </section>

      <section
        id={V2_GUIDE_SECTION.id}
        className={`scroll-mt-24 border-t py-10 sm:py-12 ${landingHorizontalPadding}`}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div
          className="mx-auto max-w-3xl rounded-2xl border p-6 sm:p-8"
          style={{
            borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
            background: 'color-mix(in srgb, var(--primary-pale) 35%, var(--surface))',
          }}
        >
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text)' }}>
            {V2_GUIDE_SECTION.headline}
          </h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            {V2_GUIDE_SECTION.intro}
          </p>
          <ul className="mt-5 space-y-2.5">
            {V2_GUIDE_SECTION.bullets.map((item) => (
              <li
                key={item}
                className="flex min-w-0 gap-2.5 text-sm leading-relaxed sm:text-base"
                style={{ color: 'var(--text)' }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href={V2_GUIDE_SECTION.ctaHref}
              className="inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80 sm:text-base"
              style={{ color: 'var(--primary)' }}
            >
              {V2_GUIDE_SECTION.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
