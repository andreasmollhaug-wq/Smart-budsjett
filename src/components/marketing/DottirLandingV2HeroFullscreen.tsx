import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { V2_HERO } from '@/components/marketing/dottirLandingV2ContentData'
import { DOTTIR_PARTNER_HERO_IMAGE } from '@/components/marketing/partnerLandingConfig'
import { CTA_HREF, landingHorizontalPadding } from '@/components/marketing/constants'
import { TRIAL_OFFER_EXTENDED_EXPLANATION, TRIAL_OFFER_HEADLINE } from '@/lib/marketing/trialCampaignCopy'

export default function DottirLandingV2HeroFullscreen() {
  return (
    <section id="topp" className="relative min-h-[100dvh] min-h-[100svh] scroll-mt-24 overflow-hidden">
      <Image
        src={DOTTIR_PARTNER_HERO_IMAGE}
        alt="Kvinne som skriver økonomiske tall og overskrifter på tavle, sett bakfra."
        fill
        priority
        className="object-cover object-[38%_58%] sm:object-[34%_52%] md:object-[32%_48%] lg:object-[28%_44%] xl:object-[26%_42%]"
        sizes="100vw"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-white/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-white/5 to-transparent lg:from-black/40 lg:via-white/10"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-white/12" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] min-h-[100svh] flex-col">
        <div
          className={`mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] sm:pb-10 lg:justify-center lg:pb-16 lg:pt-24 ${landingHorizontalPadding}`}
        >
          <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-xl">
            <h1 className="text-balance text-[1.75rem] font-bold leading-snug tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-snug">
              <span className="block">{V2_HERO.titleLine1}</span>
              <span
                className="mt-2 block bg-clip-text pb-0.5 text-transparent sm:mt-3"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 45%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                {V2_HERO.titleLine2}
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/90 sm:text-lg">
              {V2_HERO.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={CTA_HREF}
                className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-95 sm:w-auto"
                style={{ background: 'var(--primary)' }}
              >
                {V2_HERO.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#priser"
                className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
                style={{ borderColor: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.08)' }}
              >
                Se priser
              </a>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold text-white sm:text-base">{TRIAL_OFFER_HEADLINE}</p>
              <p className="mt-2 text-xs leading-relaxed text-white/75 sm:text-sm">
                {TRIAL_OFFER_EXTENDED_EXPLANATION} Ved oppstart registrerer du betalingskort — vi trekker ikke før
                prøveperioden er over.{' '}
                <a
                  href="#faq-betalingskort"
                  className="font-medium text-white underline underline-offset-2 transition-opacity hover:opacity-90"
                >
                  Les mer om prøveperiode og betaling.
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
