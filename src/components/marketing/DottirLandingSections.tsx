import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CircleDot,
  HeartHandshake,
  Target,
  Users,
} from 'lucide-react'
import {
  AUDIENCE_LINES,
  DIFFERENTIATORS,
  PRODUCT_MODULES,
  PRODUCT_PILLARS,
  PROBLEMS,
  STORY_BEATS,
  VALUE_CHAIN,
} from '@/components/marketing/dottirLandingData'
import {
  CTA_HREF,
  DOTTIR_OM_OSS_HREF,
  DOTTIR_UTFORSK_HREF,
  LOGIN_HREF,
  landingHorizontalPadding,
} from '@/components/marketing/constants'

export default function DottirLandingSections() {
  return (
    <>
      <section
        className={`border-y py-12 sm:py-14 ${landingHorizontalPadding}`}
        style={{
          borderColor: 'var(--border)',
          background:
            'linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--primary-pale) 40%, var(--surface)) 100%)',
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
              className="min-w-0 rounded-2xl border p-5 transition-shadow hover:shadow-md"
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

      <section id="verdi" className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`} style={{ background: 'var(--bg)' }}>
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

      <section id="malgruppe" className={`scroll-mt-24 py-14 sm:py-16 ${landingHorizontalPadding}`} style={{ background: 'var(--bg)' }}>
        <div className="mx-auto max-w-3xl text-center">
          <Users className="mx-auto h-8 w-8" style={{ color: 'var(--primary)' }} aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
            Målgruppe
          </h2>
          <ul className="mt-8 space-y-3 text-left">
            {AUDIENCE_LINES.map((line) => (
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
              'linear-gradient(145deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), color-mix(in srgb, var(--primary-light) 12%, var(--surface)))',
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
    </>
  )
}
