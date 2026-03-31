import Link from 'next/link'
import { CTA_HREF } from './constants'

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, var(--primary-pale), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p
          className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-muted)',
          }}
        >
          14 dagers gratis prøveperiode
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]" style={{ color: 'var(--text)' }}>
          Oversikt på økonomien — uten forkunnskaper
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-muted)' }}>
          Smart Budsjett er et enkelt og strukturert budsjettverktøy som hjelper deg å se inntekter, utgifter og hva du har igjen
          — med ferdig oppsett, så du bare fyller inn dine egne tall.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Ved oppstart registrerer du betalingskort. Du betaler ikke før etter prøveperioden er over — vi er tydelige på det, så du
          slipper overraskelser.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={CTA_HREF}
            className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            Start gratis prøveperiode
          </Link>
          <a
            href="#priser"
            className="inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition-colors hover:opacity-90 sm:w-auto"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            Se priser
          </a>
        </div>
      </div>
    </section>
  )
}
