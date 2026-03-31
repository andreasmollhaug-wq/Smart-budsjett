import { BarChart3, Layers, ListChecks, Wallet } from 'lucide-react'

const cards = [
  {
    icon: Wallet,
    title: 'Inntekter og faste kostnader',
    text: 'Se hva som kommer inn og hva som er låst til faste utgifter.',
    color: '#3B5BDB',
  },
  {
    icon: ListChecks,
    title: 'Føre og kategorisere utgifter',
    text: 'Registrer kjøp og fordel dem i kategorier uten styr.',
    color: '#0CA678',
  },
  {
    icon: BarChart3,
    title: 'Visuell forståelse hver måned',
    text: 'Diagrammer og oversikt som gjør mønster synlige.',
    color: '#F08C00',
  },
  {
    icon: Layers,
    title: 'Hva du har igjen',
    text: 'Innsikt i hva som faktisk står igjen etter alle kostnader.',
    color: '#7048E8',
  },
]

export default function LandingValueProps() {
  return (
    <section className="px-4 py-14 sm:px-6" style={{ background: 'color-mix(in srgb, var(--primary-pale) 35%, var(--bg))' }}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Hva du får med Smart Budsjett
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Struktur og kategorier er satt opp på forhånd. Du legger inn tallene dine — resten er samlet på ett sted.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {cards.map(({ icon: Icon, title, text, color }) => (
            <div
              key={title}
              className="rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}20` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
