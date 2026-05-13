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
      className={`scroll-mt-24 relative overflow-x-hidden bg-[var(--bg)] pb-10 pt-8 sm:pb-16 sm:pt-12 ${landingHorizontalPadding}`}
    >
      <div className="relative mx-auto max-w-7xl min-w-0">
        <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:items-center lg:gap-6">
          <div className="order-1 min-w-0 text-left lg:order-1 lg:pr-4">
            <p
              className="mb-4 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm sm:text-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 28%, var(--border))',
                background: 'color-mix(in srgb, var(--primary-pale) 55%, var(--surface))',
                color: 'var(--text-muted)',
              }}
            >
              <Sun className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
              Ikke bare budsjett — et livssystem i én flyt
            </p>

            <h1
              className="text-[1.65rem] font-bold leading-snug tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-snug"
              style={{ color: 'var(--text)' }}
            >
              <span className="block">Få kontroll på økonomien</span>
              <span className="mt-2 block sm:mt-3">ett steg av gangen</span>
            </h1>

            <p className="mt-5 max-w-xl text-base font-semibold sm:text-lg" style={{ color: 'var(--primary)' }}>
              Små handlinger. Stor kontroll.
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-muted)' }}>
              Dottir er et personlig system som samler økonomi, oppgaver og planlegging — slik at du kan bruke det i
              hverdagen, ikke bare «se på tall».
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HERO_CARDS.map(({ Icon, label, sub }) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border px-3 py-3 text-left shadow-sm transition-shadow hover:shadow-md sm:px-4"
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

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={CTA_HREF}
                className="inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: 'var(--primary)' }}
              >
                Start gratis prøveperiode
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

            <div className="mt-6 max-w-lg min-w-0">
              <p className="text-sm font-semibold sm:text-base" style={{ color: 'var(--text)' }}>
                14 dagers gratis prøveperiode
              </p>
              <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Ved oppstart registrerer du betalingskort — vi trekker ikke før prøveperioden er over.
              </p>
            </div>
          </div>

          <div className="relative order-2 min-h-[13rem] w-full min-w-0 sm:min-h-[18rem] lg:order-2 lg:min-h-[min(85vh,36rem)]">
            <div className="relative h-full min-h-[inherit] overflow-hidden rounded-2xl bg-[var(--bg)] lg:min-h-[min(85vh,36rem)]">
              <Image
                src={heroImageSrc}
                alt="Kvinne som skriver økonomiske tall og overskrifter på tavle, sett bakfra."
                fill
                priority
                className="object-cover object-[30%_48%] touch-manipulation sm:object-[32%_46%] lg:object-[34%_44%] [transform:scale(0.88)] [transform-origin:center_center] sm:[transform:scale(0.9)] lg:[transform:scale(0.92)]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-2/5 max-w-[12rem] bg-gradient-to-r from-[var(--bg)] from-40% to-transparent lg:w-1/3"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  )
}
