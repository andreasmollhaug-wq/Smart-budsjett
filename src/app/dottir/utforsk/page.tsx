import type { Metadata } from 'next'
import DottirUtforskPage from '@/components/marketing/DottirUtforskPage'
import { DOTTIR_UTFORSK_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Utforsk alt · Dottir'
const description =
  'Se alle modulene i Dottir — økonomi, hverdag og innsikt — samlet på én rolig flyt.'

const canonical = `${getSiteUrl()}${DOTTIR_UTFORSK_HREF}`

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

export default function DottirUtforskRoutePage() {
  return <DottirUtforskPage />
}
