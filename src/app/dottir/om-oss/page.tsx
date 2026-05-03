import type { Metadata } from 'next'
import DottirOmOssPage from '@/components/marketing/DottirOmOssPage'
import { DOTTIR_OM_OSS_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Om oss · Dottir'
const description =
  'Hvem står bak Dottir — teamet, Smart Budsjett, EnkelExcel og samarbeidet med Iris Eyfjord.'

const canonical = `${getSiteUrl()}${DOTTIR_OM_OSS_HREF}`

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

export default function DottirOmOssRoutePage() {
  return <DottirOmOssPage />
}
