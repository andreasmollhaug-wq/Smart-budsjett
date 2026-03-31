import Link from 'next/link'
import { Check } from 'lucide-react'
import { CTA_HREF } from './constants'

const soloFeatures = ['Én brukerkonto', 'Full tilgang til alle funksjoner', 'Passer deg som styrer økonomien alene']
const familyFeatures = [
  'Opp til fem brukere i samme husholdning',
  'Felles oversikt og individuelle visninger',
  'Ideelt for par og familier',
]

export default function LandingPricing() {
  return (
    <section id="priser" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Velg plan
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Alle planer inkluderer 14 dagers gratis prøveperiode. Betalingskort registreres ved oppstart. Etter prøveperioden
          faktureres valgt plan til månedlig pris med mindre du sier opp.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div
            className="flex flex-col rounded-2xl p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Solo
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              For én person
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>
                89 kr
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {' '}
                / måned
              </span>
            </p>
            <ul className="mt-8 flex flex-1 flex-col gap-3">
              {soloFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={CTA_HREF}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              Velg Solo
            </Link>
          </div>

          <div
            className="relative flex flex-col rounded-2xl p-8"
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--primary)',
              boxShadow: '0 12px 40px -12px color-mix(in srgb, var(--primary) 35%, transparent)',
            }}
          >
            <span
              className="absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              Mest valgt
            </span>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Familie
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              For to eller flere i samme husholdning
            </p>
            <p className="mt-6">
              <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>
                139 kr
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {' '}
                / måned
              </span>
            </p>
            <ul className="mt-8 flex flex-1 flex-col gap-3">
              {familyFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={CTA_HREF}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              Velg Familie
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
