import type { Metadata } from 'next'
import EnkelexcelAiLandingPreview from '@/components/marketing/EnkelexcelAiLandingPreview'
import { getSiteUrl } from '@/lib/site-url'

const title = 'EnkelExcel AI (forhåndsvisning)'
const description =
  'Forhåndsvisning av landing for EnkelExcel AI — spør om tallene dine i Smart Budsjett. Ikke indeksert; hovedforsiden er uendret.'

export const metadata: Metadata = {
  title: `${title} · Smart Budsjett`,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: `${getSiteUrl()}/preview/enkelexcel-landing`,
    siteName: 'Smart Budsjett',
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
