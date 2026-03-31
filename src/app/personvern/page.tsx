import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Personvern',
  description: 'Personvernerklæring for Smart Budsjett.',
}

export default function PersonvernPage() {
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
          Personvern
        </h1>
        <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Her kommer den fullstendige personvernerklæringen for Smart Budsjett. Teksten bør gjennomgås av dere før publisering og
          oppdateres med korrekt behandlingsansvarlig, formål, lagringstid og brukerrettigheter etter gjeldende lov.
        </p>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Inntil videre: vi behandler personopplysninger på en forsvarlig måte og kun i den grad det er nødvendig for å levere
          tjenesten. Kontakt oss dersom du har spørsmål.
        </p>
      </div>
    </div>
  )
}
