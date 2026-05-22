import type { Metadata } from 'next'
import EnkelexcelAiLandingPreview from '@/components/marketing/EnkelexcelAiLandingPreview'
import { getSiteUrl } from '@/lib/site-url'

const title = 'dottir AI (forhåndsvisning)'
const description =
  'Forhåndsvisning av landing for dottir AI — spør om tallene dine i Dottir. Ikke indeksert; hovedforsiden er uendret.'

export const metadata: Metadata = {
  title: `${title} · Dottir`,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} · Dottir`,
    description,
    url: `${getSiteUrl()}/preview/enkelexcel-landing`,
    siteName: 'Dottir',
    locale: 'nb_NO',
    type: 'website',
  },
  alternates: {
    canonical: `${getSiteUrl()}/preview/enkelexcel-landing`,
  },
}

export default function EnkelexcelLandingPreviewPage() {
  return <EnkelexcelAiLandingPreview />
}
