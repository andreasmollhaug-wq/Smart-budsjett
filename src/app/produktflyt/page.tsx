import type { Metadata } from 'next'
import Link from 'next/link'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingHeader from '@/components/marketing/LandingHeader'
import ProductFlowJourney from '@/components/marketing/ProductFlowJourney'
import { CTA_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Slik henger Smart Budsjett sammen'
const description =
  'Se hele flyten fra budsjett og transaksjoner til oversikt, sparing, gjeld, rapporter og EnkelExcel AI — med tydelig utfall per steg, før du logger inn.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: `${getSiteUrl()}/produktflyt`,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · Smart Budsjett`,
    description,
  },
  alternates: {
    canonical: `${getSiteUrl()}/produktflyt`,
  },
}

export default function ProduktflytPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <LandingHeader />
      <main className="min-w-0 px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pt-14">
        <header className="mx-auto max-w-3xl text-center">
          <p
            className="mb-4 inline-flex animate-[komIgangHero_0.55s_ease-out_both] items-center rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
            }}
          >
            Produktflyt
          </p>
          <h1
            className="animate-[komIgangHero_0.55s_ease-out_both] text-balance text-[clamp(1.5rem,5.4vw,2.5rem)] font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.5rem]"
            style={{ color: 'var(--text)', animationDelay: '70ms' }}
          >
            Ro i økonomien — uten å bli ekspert
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl animate-[komIgangHero_0.55s_ease-out_both] text-base leading-relaxed sm:text-lg"
            style={{ color: 'var(--text-muted)', animationDelay: '140ms' }}
          >
            Alt henger sammen: du legger inn plan i budsjettet, fører det som skjer i transaksjoner, og får oversikt,
            sparing, gjeld og rapporter som snakker samme språk — inkludert når dere er flere i samme husholdning.
          </p>
          <div
            className="mx-auto mt-8 flex w-full max-w-md animate-[komIgangHero_0.55s_ease-out_both] flex-col gap-3 sm:flex-row sm:justify-center"
            style={{ animationDelay: '210ms' }}
          >
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-[44px] sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              Start gratis prøveperiode
            </Link>
            <Link
              href="/guider"
              className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90 sm:min-h-[44px] sm:w-auto"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              Les guider først
            </Link>
          </div>
        </header>

        <div className="mt-12 sm:mt-16">
          <ProductFlowJourney />
        </div>

        <section className="mx-auto mt-16 max-w-3xl rounded-2xl p-4 sm:p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
            Kort: beste praksis
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed list-disc pl-5" style={{ color: 'var(--text-muted)' }}>
            <li>Juster budsjettet når livet endrer seg — planen skal tjene deg.</li>
            <li>Små, jevnlige transaksjonsoppdateringer gir bedre innsikt enn sjeldne «store oppryddinger».</li>
            <li>Bruk rapportene når du trenger dokumentasjon — tallene kommer fra det du allerede har lagt inn.</li>
            <li>Smart Budsjett er et planleggingsverktøy, ikke personlig økonomisk eller skatterådgivning.</li>
          </ul>
        </section>

        <section
          className="mx-auto mt-8 max-w-3xl rounded-2xl p-4 sm:p-8"
          style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold sm:text-xl" style={{ color: 'var(--text)' }}>
            Klar til å prøve?
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Registrer deg for 14 dagers gratis prøveperiode — du legger inn betalingskort ved oppstart, men betaler ikke før
            prøveperioden er over. Samme tydelige struktur som du ser på denne siden venter inne i appen.
          </p>
          <Link
            href={CTA_HREF}
            className="mt-5 inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-[44px] sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            Kom i gang med Smart Budsjett
          </Link>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
