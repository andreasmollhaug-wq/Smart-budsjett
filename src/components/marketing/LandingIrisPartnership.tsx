import { HeartHandshake } from 'lucide-react'

const IRIS_PAGE_HREF = 'https://enkelexcel.no/pages/iriseyfjord'

type Props = {
  /** Mindre luft under boksen når Iris kommer rett før «Laget for deg som» (f.eks. /iris). */
  tightBottom?: boolean
}

export default function LandingIrisPartnership({ tightBottom = false }: Props) {
  return (
    <section
      id="partnerskap"
      className={`scroll-mt-24 px-4 sm:px-6 ${tightBottom ? 'pt-12 pb-6 sm:pb-8' : 'py-12'}`}
    >
      <div
        className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-start sm:gap-8 sm:p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'var(--primary-pale)' }}
        >
          <HeartHandshake size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Samarbeid med Iris Eyfjord
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Iris har dokumentert reisen fra økonomisk kaos til oversikt og kontroll, og deler metodene som fungerte i
            hverdagen. I samarbeid med EnkelExcel bidrar hun med erfaring og verktøy — og vi er stolte over
            partnerskapet.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Smart Budsjett bygger på samme tanke: enkel struktur og trygghet i tallene.
          </p>
          <p className="mt-4">
            <a
              href={IRIS_PAGE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-90"
              style={{ color: 'var(--primary)' }}
            >
              Les mer om Iris på EnkelExcel
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
