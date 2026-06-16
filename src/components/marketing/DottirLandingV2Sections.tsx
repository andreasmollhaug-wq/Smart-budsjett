import Link from 'next/link'
import { ArrowRight, Check, Target } from 'lucide-react'
import {
  V2_DIFFERENTIATORS,
  V2_PAIN_CLOSING,
  V2_PAIN_POINTS,
  V2_PRODUCT_MODULES,
  V2_PRODUCT_PILLARS,
  V2_VALUE_CHAIN,
  V2_VISION,
} from '@/components/marketing/dottirLandingV2Data'
import {
  CTA_HREF,
  DOTTIR_OM_OSS_HREF,
  DOTTIR_UTFORSK_HREF,
  LOGIN_HREF,
  landingHorizontalPadding,
} from '@/components/marketing/constants'
import LandingFAQ from '@/components/marketing/LandingFAQ'
import LandingPricing from '@/components/marketing/LandingPricing'

export default function DottirLandingV2Sections() {
  return (
    <>
      <section
        id="problem"
        className={`scroll-mt-24 border-t py-14 sm:py-16 ${landingHorizontalPadding}`}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
            Kjenner du deg igjen?
          </h2>
          <div className="relative mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
            {V2_PAIN_POINTS.map(({ title, text }) => (
              <article
                key={title}
                className="min-w-0 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text)' }}>
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {text}
                </p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
            {V2_PAIN_CLOSING}
          </p>
        </div>
      </section>

      <section
        id="produkt"
        className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`}
        style={{ background: 'var(--bg)' }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
            Hva du får
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Et system du faktisk bruker — ikke bare et regneark du åpner én gang i måneden.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {V2_PRODUCT_PILLARS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="min-w-0 rounded-2xl p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'var(--primary-pale)' }}
                >
                  <Icon className="h-5 w-5 min-w-0" style={{ color: 'var(--primary)' }} aria-hidden />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
          <div
            className="mx-auto mt-10 max-w-2xl rounded-2xl p-6 shadow-sm sm:p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ul className="grid gap-2 sm:grid-cols-1">
              {V2_PRODUCT_MODULES.map((line) => (
                <li key={line} className="flex min-w-0 gap-2 text-sm sm:text-base">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: 'var(--cta-gradient)' }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span style={{ color: 'var(--text)' }}>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              <Link
                href={DOTTIR_UTFORSK_HREF}
                className="inline-flex min-h-[44px] touch-manipulation items-center justify-center font-semibold underline underline-offset-4 transition-opacity hover:opacity-80"
                style={{ color: 'var(--primary)' }}
              >
                Se alle moduler interaktivt
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section
        id="verdi"
        className={`scroll-mt-24 border-t py-14 sm:py-16 ${landingHorizontalPadding}`}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <Target className="mx-auto h-8 w-8" style={{ color: 'var(--primary)' }} aria-hidden />
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Hvorfor Dottir
            </h2>
          </div>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
            {V2_VALUE_CHAIN.map((step, i) => (
              <div key={step} className="flex items-center gap-2 sm:gap-3">
                <span
                  className="rounded-full px-3 py-1.5 text-sm font-semibold sm:px-4 sm:text-base"
                  style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                >
                  {step}
                </span>
                {i < V2_VALUE_CHAIN.length - 1 ? (
                  <span className="hidden text-lg font-light sm:inline" style={{ color: 'var(--text-muted)' }}>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <ul className="mx-auto mt-10 grid max-w-3xl gap-3">
            {V2_DIFFERENTIATORS.map((line) => (
              <li
                key={line}
                className="flex min-w-0 gap-3 rounded-2xl border p-4 shadow-sm sm:p-5"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: 'var(--cta-gradient)' }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text)' }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LandingPricing />
      <LandingFAQ />

      <section className={`border-t py-16 ${landingHorizontalPadding}`} style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div
          className="mx-auto max-w-3xl min-w-0 overflow-hidden rounded-2xl border p-8 text-center shadow-lg sm:p-10"
          style={{
            background:
              'linear-gradient(145deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), color-mix(in srgb, var(--primary-light) 12%, var(--surface)))',
            borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--border))',
          }}
        >
          <p className="mx-auto max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
            {V2_VISION}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
              style={{ background: 'var(--primary)' }}
            >
              Start gratis prøveperiode
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={DOTTIR_OM_OSS_HREF}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-95"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              Om oss
            </Link>
            <Link
              href={LOGIN_HREF}
              className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: 'color-mix(in srgb, var(--surface) 70%, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Logg inn
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
