import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Home, Layers, Sun, Users } from 'lucide-react'
import {
  CTA_HREF,
  DOTTIR_OM_OSS_HREF,
  landingHorizontalPadding,
} from '@/components/marketing/constants'

const HERO_CARDS = [
  { Icon: Users, label: 'Én sammenheng', sub: 'fra plan til handling' },
  { Icon: Home, label: 'For deg og hjemmet', sub: 'individ og husholdning' },
  { Icon: Layers, label: 'Bygget på vaner', sub: 'små grep som holder' },
] as const

export default function DottirLandingHeroSplit({ heroImageSrc }: { heroImageSrc: string }) {
  return (
    <section
      id="topp"
      className={`scroll-mt-24 relative overflow-x-hidden bg-[var(--bg)] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:pt-12 ${landingHorizontalPadding}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(165deg, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 50%), radial-gradient(ellipse 90% 50% at 18% 8%, rgba(112, 72, 232, 0.08), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: 'radial-gradient(circle at center, var(--border) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl min-w-0">
        <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:items-center lg:gap-6">
          <div className="order-2 min-w-0 text-center lg:order-1 lg:pr-4 lg:text-left">
            <div className="mb-4 flex justify-center lg:justify-start">
              <p
                className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm sm:text-sm lg:justify-start"
                style={{
                  borderColor: 'color-mix(in srgb, var(--primary) 28%, var(--border))',
                  background: 'color-mix(in srgb, var(--primary-pale) 55%, var(--surface))',
                  color: 'var(--text-muted)',
                }}
              >
                <Sun className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
                Ikke bare budsjett — et livssystem i én flyt
              </p>
            </div>

            <h1 className="text-balance text-[1.65rem] font-bold leading-snug tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-snug" style={{ color: 'var(--text)' }}>
              <span className="block">Få kontroll på økonomien </span>
              <span
                className="mt-2 block bg-clip-text pb-0.5 text-transparent sm:mt-3 md:pb-1"
                style={{
                  backgroundImage: 'var(--marketing-hero-heading-gradient)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                ett steg av gangen
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base font-semibold sm:text-lg lg:mx-0" style={{ color: 'var(--primary)' }}>
              Små handlinger. Stor kontroll.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href={CTA_HREF}
                className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: 'var(--primary)' }}
              >
                Start gratis prøveperiode
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={DOTTIR_OM_OSS_HREF}
                className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-7 py-3.5 text-sm font-medium transition-colors hover:opacity-90 sm:w-auto"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                Hvem står bak dette?
              </Link>
            </div>

            <p
              className="mx-auto mt-6 max-w-xl text-left text-base leading-relaxed sm:mt-8 sm:text-lg lg:mx-0"
              style={{ color: 'var(--text-muted)' }}
            >
              Dottir er et personlig system som samler økonomi, oppgaver og planlegging — slik at du kan bruke det i
              hverdagen, ikke bare «se på tall».
            </p>

            <div
              role="list"
              aria-label="Høydepunkter"
              className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-visible pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:snap-none"
            >
              {HERO_CARDS.map(({ Icon, label, sub }) => (
                <div
                  role="listitem"
                  key={label}
                  className="min-w-[16rem] shrink-0 snap-start rounded-2xl border px-3 py-3 text-left shadow-sm transition-shadow hover:shadow-md sm:min-w-0 sm:px-4"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div
                    className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: 'var(--primary-pale)' }}
                  >
                    <Icon className="h-4 w-4 text-[var(--primary)]" aria-hidden />
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {label}
                  </p>
                  <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-lg min-w-0 text-center sm:mt-10 lg:mx-0 lg:text-left">
              <p className="text-sm font-semibold sm:text-base" style={{ color: 'var(--text)' }}>
                14 dagers gratis prøveperiode
              </p>
              <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Ved oppstart registrerer du betalingskort — vi trekker ikke før prøveperioden er over.
              </p>
            </div>
          </div>

          <div className="relative order-1 w-full min-w-0 lg:order-2 lg:flex lg:min-h-[min(85vh,36rem)]">
            <div className="relative aspect-[16/11] max-h-[min(52vh,23rem)] w-full overflow-hidden rounded-2xl bg-[var(--bg)] shadow-lg ring-1 ring-black/[0.05] touch-manipulation sm:max-h-[min(58vh,28rem)] lg:aspect-auto lg:max-h-none lg:min-h-[min(85vh,36rem)] lg:flex-1 lg:rounded-2xl">
              <Image
                src={heroImageSrc}
                alt="Kvinne som skriver økonomiske tall og overskrifter på tavle, sett bakfra."
                fill
                priority
                className="object-cover object-[30%_48%] sm:object-[32%_46%] lg:object-[34%_44%] [transform:scale(0.88)] [transform-origin:center_center] sm:[transform:scale(0.9)] lg:[transform:scale(0.92)]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[4.25rem] bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-transparent sm:h-24 lg:hidden"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-2/5 max-w-[12rem] bg-gradient-to-r from-[var(--bg)] from-40% to-transparent lg:block lg:w-1/3"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  )
}
