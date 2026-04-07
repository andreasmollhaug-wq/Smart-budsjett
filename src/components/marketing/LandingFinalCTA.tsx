import Link from 'next/link'
import { CTA_HREF } from './constants'

export default function LandingFinalCTA() {
  return (
    <section className="px-4 pb-16 pt-4 sm:px-6">
      <div
        className="mx-auto max-w-3xl rounded-2xl p-6 text-center text-white sm:p-10 md:p-12"
        style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4C6EF5 50%, #7048E8 100%)' }}
      >
        <h2 className="text-2xl font-bold sm:text-3xl">Klar for oversikt?</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-95 sm:text-base">
          Start 14 dagers gratis prøveperiode med kortregistrering. Ingen trekk før prøveperioden er over — deretter får du full
          tilgang til Smart Budsjett til månedlig pris.
        </p>
        <Link
          href={CTA_HREF}
          className="mt-8 inline-flex min-h-[44px] w-full max-w-xs items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-95 sm:w-auto sm:max-w-none sm:px-8"
          style={{ color: 'var(--primary)' }}
        >
          <span className="sm:hidden">Start gratis prøve</span>
          <span className="hidden sm:inline">Start gratis prøveperiode</span>
        </Link>
      </div>
    </section>
  )
}
