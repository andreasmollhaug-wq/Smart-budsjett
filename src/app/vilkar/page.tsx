import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vilkår',
  description: 'Bruksvilkår for Smart Budsjett.',
}

export default function VilkarPage() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          ← Til forsiden
        </Link>
        <h1 className="mt-8 text-3xl font-bold" style={{ color: 'var(--text)' }}>
          Vilkår for bruk
        </h1>
        <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Her kommer de fullstendige bruksvilkårene for Smart Budsjett, inkludert abonnement, betaling, oppsigelse og
          ansvarsbegrensning. Erstatt denne teksten med juridisk gjennomgått innhold før produksjon.
        </p>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Ved å bruke tjenesten aksepterer du disse vilkårene. Ved motstrid gjelder den til enhver tid gjeldende versjon publisert
          på denne siden.
        </p>
      </div>
    </div>
  )
}
