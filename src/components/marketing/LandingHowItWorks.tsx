import Link from 'next/link'
import { landingHorizontalPadding } from './constants'

const steps = [
  {
    step: '1',
    title: 'Alt ligger klart',
    text: 'Struktur, kategorier og oppsett er ferdig — du slipper å starte fra blankt ark.',
  },
  {
    step: '2',
    title: 'Fyll inn dine tall',
    text: 'Legg inn inntekter, faste kostnader og utgifter slik det passer deg.',
  },
  {
    step: '3',
    title: 'Se oversikten',
    text: 'Få et visuelt bilde av hvor pengene går og hva du har igjen.',
  },
  {
    step: '4',
    title: 'Juster underveis',
    text: 'Endrer hverdagen seg? Oppdater — oversikten følger med deg.',
  },
]

export default function LandingHowItWorks() {
  return (
    <section id="slik-fungerer" className={`scroll-mt-24 py-14 ${landingHorizontalPadding}`}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Slik fungerer det
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Fire enkle steg fra tom konto til ro i hodet.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Vil du se hvordan modulene henger sammen?{' '}
          <Link
            href="/produktflyt"
            className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            Utforsk produktflyten
          </Link>
        </p>
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map(({ step, title, text }) => (
            <li
              key={step}
              className="flex gap-4 rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
              >
                {step}
              </span>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
