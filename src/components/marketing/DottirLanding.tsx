'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  Check,
  CircleDot,
  HeartHandshake,
  Home,
  Layers,
  Menu,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import LandingFooter from '@/components/marketing/LandingFooter'
import { CTA_HREF, DOTTIR_OM_OSS_HREF, DOTTIR_PREVIEW_HREF, LOGIN_HREF, landingHorizontalPadding } from '@/components/marketing/constants'

const NAV = [
  { href: DOTTIR_OM_OSS_HREF, label: 'Om oss' },
  { href: '#kjerne', label: 'Kjerne' },
  { href: '#produkt', label: 'Produktet' },
  { href: '#problem', label: 'Problem' },
  { href: '#verdi', label: 'Verdi' },
  { href: '#malgruppe', label: 'Målgruppe' },
] as const

/** Korte «grep» som gjør siden mer interessant å skanne */
const STORY_BEATS = [
  {
    title: 'Hvor ble det av pengene?',
    text: 'Ikke fordi du ikke «kan økonomi» — men fordi livet skjer mellom to bankutsagn.',
  },
  {
    title: 'Hvorfor gir budsjett seg ofte?',
    text: 'For store ambisjoner på én kveld gir lite rom for de små justeringene som faktisk holder.',
  },
  {
    title: 'Hva hvis alt hang sammen?',
    text: 'Plan, forbruk, gjeld, sparing og hverdagsoppgaver — som ett spor du kan følge sammen med dem du bor med.',
  },
] as const

const PRODUCT_PILLARS = [
  {
    icon: Layers,
    title: 'Økonomi og oversikt',
    text: 'Struktur på inntekter og utgifter, og tydelig bilde av hvordan pengene brukes.',
  },
  {
    icon: TrendingUp,
    title: 'Gjeld og sparing',
    text: 'Nedbetaling, mål og smartere valg for veien videre.',
  },
  {
    icon: Home,
    title: 'Husholdning og samarbeid',
    text: 'Fellesskap rundt økonomi — ikke bare tall på én skjerm.',
  },
  {
    icon: Brain,
    title: 'Innsikt og hjelp',
    text: 'Rapporter og forklaringer du faktisk kan bruke i hverdagen.',
  },
] as const

const PRODUCT_MODULES = [
  'Budsjett (plan)',
  'Transaksjoner (faktisk bruk)',
  'Gjeld og nedbetaling',
  'Sparing og mål',
  'Abonnementer',
  'Oppgaver og rutiner',
  'AI-basert forklaring og hjelp',
] as const

const PROBLEMS = [
  'Lite oversikt over egen økonomi — pengene «forsvinner» uten kontroll.',
  'Budsjett forsøkes, men det er vanskelig å holde ut.',
  'Verktøy er enten for enkle eller for tunge i bruk.',
  'Samarbeid om økonomi i husholdningen er krevende uten felles system.',
] as const

const VALUE_CHAIN = ['Oversikt', 'Struktur', 'Handling', 'Forståelse', 'Kontroll'] as const

const DIFFERENTIATORS = [
  'Flere funksjoner samlet — mindre fragmentering mellom apper og ark.',
  'Fokus på bruk i hverdagen, ikke bare historikk og grafer.',
  'Enkelt å komme i gang — strukturert nok til å gi reell verdi.',
  'Fungerer for deg alene og for dere som deler husholdning.',
  'Kobler økonomi med daglig struktur: oppgaver og rutiner.',
] as const

export default function DottirLanding() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const mobileNav =
    mobileOpen && typeof document !== 'undefined' ? (
      <div
        className="fixed inset-0 z-[60] lg:hidden"
        id="dottir-landing-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigasjon"
      >
        <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk meny" onClick={close} />
        <aside
          className="absolute inset-y-0 left-0 flex w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto shadow-xl"
          style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b px-3 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Meny
            </span>
            <button
              type="button"
              onClick={close}
              className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-label="Lukk meny"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-col gap-1 p-3">
            {NAV.map((item) =>
              item.href.startsWith('/') ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium touch-manipulation"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium touch-manipulation"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </a>
              ),
            )}
            <Link
              href="/"
              onClick={close}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium touch-manipulation"
              style={{ color: 'var(--text-muted)' }}
            >
              Smart Budsjett — hovedforside
            </Link>
          </div>
        </aside>
      </div>
    ) : null

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className={`mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-2 py-3 sm:gap-4 sm:py-3 ${landingHorizontalPadding}`}
        >
          <Link
            href={DOTTIR_PREVIEW_HREF}
            className="flex min-w-0 max-w-[min(100%,14rem)] shrink items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:max-w-none sm:gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #7048E8, #4C6EF5)' }}
              aria-hidden
            >
              Dt
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
                Dottir
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                Konsept · forhåndsvisning
              </p>
            </div>
          </Link>

          <nav className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90 lg:hidden"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-expanded={mobileOpen}
              aria-controls="dottir-landing-nav"
              aria-label={mobileOpen ? 'Lukk meny' : 'Åpne meny'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {NAV.map((item) =>
              item.href.startsWith('/') ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-flex lg:items-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-flex lg:items-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </a>
              ),
            )}
            <Link
              href={LOGIN_HREF}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 py-2 text-sm font-medium touch-manipulation sm:px-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Logg inn
            </Link>
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[44px] max-w-[11rem] flex-col items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-semibold leading-tight text-white shadow-sm transition-opacity hover:opacity-95 touch-manipulation sm:max-w-none sm:px-4 sm:text-sm"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              <span className="sm:hidden">Prøv gratis</span>
              <span className="hidden sm:inline">Utforsk Smart Budsjett</span>
            </Link>
          </nav>
        </div>
      </header>
      {mobileNav ? createPortal(mobileNav, document.body) : null}

      <main>
        <section
          id="topp"
          className={`scroll-mt-24 relative overflow-x-hidden pb-12 pt-8 sm:pb-16 sm:pt-12 ${landingHorizontalPadding}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(165deg, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 42%), radial-gradient(ellipse 85% 65% at 15% 15%, rgba(112, 72, 232, 0.14), transparent), radial-gradient(ellipse 75% 55% at 92% 78%, rgba(76, 110, 245, 0.12), transparent)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.45]"
              style={{
                backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
              }}
            />
          </div>

          <div className="relative mx-auto max-w-4xl min-w-0 text-center">
            <p
              className="mx-auto mb-4 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-4 py-1.5 text-center text-xs font-semibold shadow-sm sm:text-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 35%, var(--border))',
                background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
                color: 'var(--text-muted)',
              }}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
              Konsept · ikke bare budsjett — et livssystem i én flyt
            </p>

            <h1 className="text-[1.65rem] font-bold leading-snug tracking-tight sm:text-4xl md:text-5xl md:leading-snug" style={{ color: 'var(--text)' }}>
              <span className="block">Få kontroll på økonomien</span>
              <span
                className="mt-2 inline-block bg-clip-text pb-1 text-transparent sm:mt-3 md:pb-1.5"
                style={{
                  backgroundImage: 'linear-gradient(120deg, #3B5BDB 0%, #7048E8 55%, #4C6EF5 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                ett steg av gangen
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base font-semibold sm:text-lg" style={{ color: 'var(--primary)' }}>
              Små handlinger. Stor kontroll.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-muted)' }}>
              Dottir er et konsept for et personlig system som samler økonomi, oppgaver og planlegging — slik at du kan bruke det i
              hverdagen, ikke bare «se på tall».
            </p>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { label: 'Én sammenheng', sub: 'fra plan til handling' },
                { label: 'For deg og hjemmet', sub: 'individ og husholdning' },
                { label: 'Bygget på vaner', sub: 'små grep som holder' },
              ].map(({ label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl border px-4 py-3 text-center shadow-sm transition-shadow hover:shadow-md min-w-0"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'color-mix(in srgb, var(--surface) 94%, var(--primary-pale))',
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {label}
                  </p>
                  <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={CTA_HREF}
                className="inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
              >
                Utforsk Smart Budsjett
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={DOTTIR_OM_OSS_HREF}
                className="inline-flex w-full touch-manipulation items-center justify-center rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors hover:opacity-90 sm:w-auto"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                Hvem står bak dette?
              </Link>
            </div>

            <p className="mt-7 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Dette er en intern konseptside — ikke lenket fra hovednavigasjon.
            </p>
          </div>
        </section>

        <section
          className={`border-y py-12 sm:py-14 ${landingHorizontalPadding}`}
          style={{
            borderColor: 'var(--border)',
            background: 'linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--primary-pale) 40%, var(--surface)) 100%)',
          }}
        >
          <figure className="mx-auto max-w-3xl">
            <blockquote
              className="relative rounded-2xl border px-6 py-8 text-left shadow-sm sm:px-10 sm:py-10"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
                background: 'var(--surface)',
              }}
            >
              <span
                className="absolute left-4 top-4 font-serif text-5xl leading-none opacity-[0.15] sm:left-6 sm:text-6xl"
                style={{ color: 'var(--primary)' }}
                aria-hidden
              >
                «
              </span>
              <p className="relative text-lg font-semibold leading-snug sm:text-xl sm:leading-snug" style={{ color: 'var(--text)' }}>
                Kontroll skapes ikke gjennom store grep, men gjennom små, enkle handlinger — én ting av gangen.
              </p>
              <figcaption className="relative mt-5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Tanken som gjør Dottir til mer enn et budsjettnavn.
              </figcaption>
            </blockquote>
          </figure>
        </section>

        <section id="grep-beats" className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`}>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
              {STORY_BEATS.map(({ title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border p-5 transition-shadow hover:shadow-md min-w-0"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                  }}
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
        </section>

        <section id="kjerne" className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`}>
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-md"
                style={{ background: 'var(--primary-pale)' }}
              >
                <CircleDot className="h-6 w-6" style={{ color: 'var(--primary)' }} aria-hidden />
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                Navnet og tanken
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
                «Dottir» har nordisk preg, men handler ikke bokstavelig om «datter». Her er det rom for{' '}
                <strong style={{ color: 'var(--text)' }}>små punkter</strong> —{' '}
                <strong style={{ color: 'var(--text)' }}>små steg</strong> — og{' '}
                <strong style={{ color: 'var(--text)' }}>progresjon over tid</strong>. Et fleksibelt navn som kan vokse fra økonomi
                til et bredere livssystem.
              </p>
            </div>
          </div>
        </section>

        <section
          id="produkt"
          className={`scroll-mt-24 border-t py-14 sm:py-16 ${landingHorizontalPadding}`}
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Hva Dottir er ment å være
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Ikke bare et budsjettverktøy du åpner én gang i måneden — et system du faktisk bruker.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {PRODUCT_PILLARS.map(({ icon: Icon, title, text }) => (
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
              className="mx-auto mt-10 max-w-3xl rounded-2xl p-6 shadow-sm sm:p-8"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-center text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
                Samlet i én helhet
              </h3>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {PRODUCT_MODULES.map((line) => (
                  <li key={line} className="flex min-w-0 gap-2 text-sm sm:text-base">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                    <span style={{ color: 'var(--text)' }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="problem"
          className={`scroll-mt-24 border-t py-14 sm:py-16 ${landingHorizontalPadding}`}
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Problem Dottir adresserer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Mange verktøy viser historikk, eller krever tunge oppsett. Dottir er ment å bygge bro: struktur uten å måtte bli
              regneekspert.
            </p>
            <ul className="mt-10 space-y-3">
              {PROBLEMS.map((line) => (
                <li
                  key={line}
                  className="flex min-w-0 gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} aria-hidden />
                  <span className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text)' }}>
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="verdi"
          className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`}
          style={{ background: 'var(--bg)' }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <Target className="mx-auto h-8 w-8" style={{ color: 'var(--primary)' }} aria-hidden />
              <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                Fra oversikt til kontroll
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
                Kjerneverdien kan sammenfattes slik:
              </p>
            </div>

            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
              {VALUE_CHAIN.map((step, i) => (
                <div key={step} className="flex items-center gap-2 sm:gap-3">
                  <span
                    className="rounded-full px-3 py-1.5 text-sm font-semibold sm:px-4 sm:text-base"
                    style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                  >
                    {step}
                  </span>
                  {i < VALUE_CHAIN.length - 1 ? (
                    <span className="hidden text-lg font-light sm:inline" style={{ color: 'var(--text-muted)' }}>
                      →
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Ferdig struktur, tydelig skille mellom plan og faktisk forbruk, og grensesnitt som gjør det lett å føre og følge opp
              — med visuell innsikt som gir mening.
            </p>
          </div>
        </section>

        <section
          className={`border-y py-14 sm:py-16 ${landingHorizontalPadding}`}
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-3">
              <HeartHandshake className="h-8 w-8 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                Hvorfor ikke bare «enda en app»
              </h2>
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Dottir er tenkt som et system — nærmere et «operativsystem for hverdagsøkonomi» enn et enkelt punktverktøy.
            </p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {DIFFERENTIATORS.map((line) => (
                <li
                  key={line}
                  className="flex min-w-0 gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
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

        <section
          id="malgruppe"
          className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`}
          style={{ background: 'var(--bg)' }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <Users className="mx-auto h-8 w-8" style={{ color: 'var(--primary)' }} aria-hidden />
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Målgruppe
            </h2>
            <ul className="mt-8 space-y-3 text-left">
              {[
                'Privatpersoner som vil ha bedre oversikt.',
                'Par og familier som ønsker kontroll sammen.',
                'De som har prøvd budsjett før — og vil ha noe som holder i hverdagen.',
                'De som vil ha mer enn bankappen, men mindre tungvint enn Excel.',
              ].map((line) => (
                <li
                  key={line}
                  className="min-w-0 rounded-2xl border px-4 py-3 text-sm shadow-sm sm:text-base"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className={`border-t py-14 sm:py-16 ${landingHorizontalPadding}`}
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Tone og retning
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Enkel, rolig og tydelig kommunikasjon — uten tung finansjargon eller overdrevet salgsspråk. Fokus på forståelse,
              kontroll, små steg og mestring.
            </p>
            <p className="mx-auto mt-6 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Andre formuleringer som passer budskapet: «Oversikt. Struktur. Kontroll.» · «Alt du trenger for å styre økonomien
              din — samlet på ett sted» · «Gjør økonomi enkelt».
            </p>
          </div>
        </section>

        <section className={`border-t py-16 ${landingHorizontalPadding}`} style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div
            className="mx-auto max-w-3xl min-w-0 overflow-hidden rounded-2xl border p-8 text-center shadow-lg sm:p-10"
            style={{
              background:
                'linear-gradient(145deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), color-mix(in srgb, #7048E8 10%, var(--surface)))',
              borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--border))',
            }}
          >
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
              Visjon
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
              Å bli en naturlig del av hverdagen i Norden for dem som ønsker kontroll — med økonomistyring som er tilgjengelig,
              vanedannende på sunn måte, og som forenkler samarbeid i husholdningen.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <Link
                href={CTA_HREF}
                className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
              >
                Start med Smart Budsjett i dag
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={DOTTIR_OM_OSS_HREF}
                className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-95"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                Om oss — team og Iris
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
      </main>

      <LandingFooter />
    </div>
  )
}
