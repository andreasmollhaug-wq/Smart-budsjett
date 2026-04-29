import type { Metadata } from 'next'
import DottirOmOssPage from '@/components/marketing/DottirOmOssPage'
import { DOTTIR_OM_OSS_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Om oss · Dottir (utkast)'
const description =
  'Hvem står bak Dottir-konseptet — Smart Budsjett, EnkelExcel og kontekst om Iris Eyfjord. Intern forhåndsvisning.'

export const metadata: Metadata = {
  title: `${title} · Smart Budsjett`,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: `${getSiteUrl()}${DOTTIR_OM_OSS_HREF}`,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  alternates: {
    canonical: `${getSiteUrl()}${DOTTIR_OM_OSS_HREF}`,
  },
}

export default function DottirOmOssRoutePage() {
  return <DottirOmOssPage />
}
