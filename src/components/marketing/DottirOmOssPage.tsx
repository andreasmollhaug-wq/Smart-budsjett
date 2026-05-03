import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  ExternalLink,
  HeartHandshake,
  Layers,
  Mail,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import LandingFooter from '@/components/marketing/LandingFooter'
import {
  CTA_HREF,
  DOTTIR_ICON_SRC,
  DOTTIR_HOME_HREF,
  LOGIN_HREF,
  landingHorizontalPadding,
} from '@/components/marketing/constants'
import { COMPANY_NAME, CONTACT_EMAIL } from '@/lib/legal'

const IRIS_DINSIDE_ARTICLE =
  'https://dinside.dagbladet.no/okonomi/skyldte-millioner-det-var-grusomt/84060622'

const IRIS_ENKELEXCEL_PAGE = 'https://enkelexcel.no/pages/iriseyfjord'

const WHY_WE_EXIST = [
  {
    icon: Compass,
    title: 'Økonomi er liv — ikke bare linjer',
    text: 'Vi bygger ut fra det ekte: folk som må prioritere, samarbeide og tilpasse seg uker som ikke finnes i et stillingsbilde.',
  },
  {
    icon: Layers,
    title: 'Struktur du orker å holde',
    text: 'Smart Budsjett gir ferdig tankesett og oversikt. Dottir er et mulig neste steg: mer av hverdagen samlet i én flyt.',
  },
  {
    icon: Target,
    title: 'Små steg som holdes ut',
    text: 'Vi tror mestring kommer av gjentakelser — ikke av å perfeksjonere budsjettet én søndag og gi opp på onsdag.',
  },
] as const

const WE_PROMISE = [
  'Språk og grensesnitt som ikke skremmer deg fra å åpne appen.',
  'Tydelig skille mellom plan og det som faktisk skjedde — uten skam.',
  'Rom for husholdning og samarbeid, ikke bare «én bruker og ett tall».',
  'Respekt for at gjeld, sparing og hverdag henger sammen — ikke i siloer.',
] as const

export default function DottirOmOssPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--surface) 93%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className={`mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-3 py-3 sm:py-4 ${landingHorizontalPadding}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0">
              <Image
                src={DOTTIR_ICON_SRC}
                alt=""
                width={40}
                height={40}
                className="object-contain"
              />
            </span>
            <p className="truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
              Om oss
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
        {/* Hero */}
        <section className={`relative overflow-x-hidden pb-14 pt-10 sm:pb-20 sm:pt-14 ${landingHorizontalPadding}`}>
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
              Bak Dottir — ikke bare et navn på lysbakgrunn
            </p>
            <h1 className="mt-6 text-balance text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl md:leading-[1.08]" style={{ color: 'var(--text)' }}>
              Folk som vil gjøre økonomi{' '}
              <span
                className="bg-clip-text pb-0.5 text-transparent md:pb-1"
                style={{
                  backgroundImage: 'linear-gradient(115deg, #3B5BDB 0%, #7048E8 50%, #4C6EF5 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                tilgjengelig og brukt
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-muted)' }}>
              Vi jobber under navnet {COMPANY_NAME}, med Smart Budsjett som produktet tusenvis kan ta i bruk i dag. Dottir handler om hvordan den samme respekten for hverdagen kan utvikles videre — mer samlet, mer meningsfullt — uten å
              miste det rolige språket vi er kjent for.
            </p>
          </div>
        </section>

        {/* Why */}
        <section className={`border-y py-14 sm:py-16 ${landingHorizontalPadding}`} style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                Derfor bygger vi i dette tempoet
              </h2>
              <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
                Ikke for å vinne «raskest til marked», men for å gjøre ting riktig for folk som ikke har luksus til å mislykkes to
                ganger med økonomiverktøyet.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {WHY_WE_EXIST.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="min-w-0 rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: 'var(--primary-pale)' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden />
                  </div>
                  <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text)' }}>
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team narrative */}
        <section className={`py-14 sm:py-16 ${landingHorizontalPadding}`}>
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-14">
            <div className="min-w-0 space-y-5">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
                Team og produkt
              </p>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl" style={{ color: 'var(--text)' }}>
                Enkel struktur er ikke et kompromiss — det er et valg
              </h2>
              <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Vi kommer fra et miljø der økonomi ikke bare diskuteres i studio, men i barnehagekøen og mellom to jobber. Smart
                Budsjett har blitt til gjennom iterasjon, samtaler med brukere og samarbeid med folk som tør å si hvordan det
                faktisk føles når postkassen blir skrekken.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Dottir er ikke «ny PR». Det er et forsøk på å sette ord og retning på hvordan vi vil at neste generasjon
                verktøy skal oppleves: som et sted du lever — ikke et ark du skammer deg over at du ikke åpnet i går.
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <Link href="/" className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-90" style={{ color: 'var(--primary)' }}>
                  Smart Budsjett på forsiden
                </Link>{' '}
                er produktet du kan bruke i dag. Dottir er veien videre — samme team og samme respekt for hverdagen, med et
                bredere system for økonomi og planlegging.
              </p>
            </div>

            <aside
              className="relative min-w-0 overflow-hidden rounded-3xl border p-8 shadow-lg"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 18%, var(--border))',
                background:
                  'linear-gradient(145deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), color-mix(in srgb, #7048E8 8%, var(--surface)))',
              }}
            >
              <BookOpen className="h-9 w-9 opacity-90" style={{ color: 'var(--primary)' }} aria-hidden />
              <blockquote className="relative mt-6 text-lg font-semibold leading-snug sm:text-xl" style={{ color: 'var(--text)' }}>
                Vi bygger ikke for å imponere analytikere. Vi bygger for at du skal kunne forklare budsjettet til den du deler
                kjøleskap med — uten å miste ansikt.
              </blockquote>
              <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Slik tenker vi på tillit: åpenhet om hva produktet kan og ikke kan, og språk som holder når livet er travelt.
              </p>
            </aside>
          </div>
        </section>

        {/* Iris */}
        <section className={`border-y py-14 sm:py-16 ${landingHorizontalPadding}`} style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl p-2" style={{ background: 'var(--primary-pale)' }}>
                    <HeartHandshake className="h-6 w-6 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
                    Samarbeid og stemme utenfra
                  </p>
                </div>
                <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                  Iris Eyfjord — erfaring fra bunnen av lista og opp
                </h2>
              </div>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
              <div className="min-w-0 space-y-4 text-[15px] leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
                <p style={{ color: 'var(--text)' }}>
                  <strong>Iris Eyfjord Hreidarsdottir</strong> har vært åpen om en lang og krevende økonomisk reise — fra tid der
                  hver krone måtte strekkes, til systematisk kartlegging av krav, nedbetaling over tid og grep som snøballmetoden
                  der det ga mening i hennes situasjon.
                </p>
                <p>
                  Når noen har stått midt i inkasso, lønnstrekk og flytting med barn — og likevel dokumentert veien videre — har vi
                  som bygger verktøy en ekstra grunn til å ydmyke oss: tallene i appen er alltid noens liv.
                </p>
                <p>
                  I januar 2026 fulgte DinSide hennes historie i dybden: fra stor gjeld og svært stramt budsjett, til konkrete grep
                  og et mål om å bli gjeldsfri. Artikkelen er signert DinSides redaksjon og er en uavhengig journalistisk kilde til
                  hennes erfaring — vi lenker til den med respekt for kildekritikk og Iris sitt eie av sin historie.
                </p>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="min-w-0 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Fra reportasjen
                  </p>
                  <p className="mt-3 text-sm font-medium italic leading-relaxed" style={{ color: 'var(--text)' }}>
                    «Det var helt grusomt. Jeg klarte ikke å tømme postkassa …»
                  </p>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Sitat gjengitt etter DinSides intervju — om hvordan økonomisk press kan ramme alt fra selvfølge til det å åpne
                    posten.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href={IRIS_DINSIDE_ARTICLE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 sm:flex-initial sm:justify-start sm:px-5"
                    style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
                  >
                    Les reportasjen i DinSide
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  </a>
                  <a
                    href={IRIS_ENKELEXCEL_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-95 sm:flex-initial sm:justify-start sm:px-5"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    Iris på EnkelExcel
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </a>
                </div>

                <Link
                  href="/iris"
                  className="inline-flex min-h-[44px] touch-manipulation items-center gap-2 text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-90"
                  style={{ color: 'var(--primary)' }}
                >
                  Samarbeidspartner på Smart Budsjett — kampanjesiden «Iris»
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Promises */}
        <section className={`py-14 sm:py-16 ${landingHorizontalPadding}`}>
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                  Hva vi forsøker å holde oss til
                </h2>
                <p className="mt-2 max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
                  Ikke lover om avkastning — men om tone og retning i alt vi legger ut.
                </p>
              </div>
              <Users className="hidden h-12 w-12 shrink-0 opacity-80 sm:block" style={{ color: 'var(--primary)' }} aria-hidden />
            </div>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {WE_PROMISE.map((line) => (
                <li
                  key={line}
                  className="flex min-w-0 gap-3 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--primary)' }} aria-hidden />
                  <span className="text-sm leading-relaxed sm:text-[15px]" style={{ color: 'var(--text)' }}>
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact + CTA */}
        <section className={`border-t pb-16 pt-4 ${landingHorizontalPadding}`} style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div className="mx-auto max-w-3xl">
            <div
              className="min-w-0 overflow-hidden rounded-2xl border px-6 py-8 shadow-lg sm:px-10 sm:py-10"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
                background:
                  'linear-gradient(155deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), color-mix(in srgb, #7048E8 10%, var(--surface)))',
              }}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text)' }}>
                    Si hei — eller bare luft et spørsmål
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
                    Vi leser e-post fra folk som bryr seg om retningen til Smart Budsjett og Dottir. Del gjerne hva
                    som mangler i din hverdag — det driver oss.
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-5 inline-flex min-h-[44px] touch-manipulation items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-95"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <div
                className="mt-10 flex flex-col gap-3 border-t pt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent)' }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={DOTTIR_HOME_HREF}
                    className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-95"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Tilbake til Dottir
                  </Link>
                  <Link
                    href={CTA_HREF}
                    className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                    style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
                  >
                    Start gratis prøveperiode
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                <Link
                  href={LOGIN_HREF}
                  className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Har du allerede konto? Logg inn
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>

      <LandingFooter variant="dottir" />
    </div>
  )
}
