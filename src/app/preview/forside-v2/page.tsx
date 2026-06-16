import type { Metadata } from 'next'
import DottirLandingV2 from '@/components/marketing/DottirLandingV2'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Forside (forhåndsvisning)'
const description = 'Forhåndsvisning av Dottir-forsiden — samme innhold som live på /.'

export const metadata: Metadata = {
  title: `${title} · Dottir`,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} · Dottir`,
    description,
    url: `${getSiteUrl()}/preview/forside-v2`,
    siteName: 'Dottir',
    locale: 'nb_NO',
    type: 'website',
  },
  alternates: {
    canonical: `${getSiteUrl()}/`,
  },
}

export default function ForsideV2PreviewPage() {
  return <DottirLandingV2 />
}
