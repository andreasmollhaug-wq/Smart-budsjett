import { HelpCircle, PieChart, Sparkles } from 'lucide-react'

const items = [
  {
    icon: HelpCircle,
    title: 'Usikker på hvor pengene blir av',
    text: 'Du vil vite hva som faktisk går ut av kontoen hver måned.',
  },
  {
    icon: PieChart,
    title: 'Vil ha oversikt over inntekter og utgifter',
    text: 'Du ønsker et tydelig bilde — ikke et regneark du må bygge selv.',
  },
  {
    icon: Sparkles,
    title: 'Vil ta bedre valg i hverdagen',
    text: 'Små grep blir lettere når du ser helheten på ett sted.',
  },
]

export default function LandingForWhom() {
  return (
    <section className="px-4 pb-14 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Laget for deg som
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Ikke for komplisert økonomistyring — men for hverdagsøkonomi du faktisk bruker.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary-pale)' }}
              >
                <Icon size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
