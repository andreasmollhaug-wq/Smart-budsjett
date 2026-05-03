import type { Metadata } from 'next'
import DottirLanding from '@/components/marketing/DottirLanding'
import { DOTTIR_HOME_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Dottir'
const description =
  'Dottir samler økonomi, oppgaver og planlegging — for kontroll i hverdagen. Utforsk produktet og start gratis prøveperiode.'

const canonical = `${getSiteUrl()}${DOTTIR_HOME_HREF}`

export const metadata: Metadata = {
  title,
  description,
  /** Ikke indeksert til merkenavn er offentlig lansert — fjern når dere går live. */
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: canonical,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  alternates: {
    canonical,
  },
}

export default function DottirPage() {
  return <DottirLanding />
}
