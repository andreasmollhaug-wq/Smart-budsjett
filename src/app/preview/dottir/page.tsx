import type { Metadata } from 'next'
import DottirLanding from '@/components/marketing/DottirLanding'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Dottir (konsept · forhåndsvisning)'
const description =
  'Konseptside for Dottir — digital løsning for kontroll i hverdagen med utgangspunkt i økonomi. Intern forhåndsvisning; ikke indeksert.'

export const metadata: Metadata = {
  title: `${title} · Smart Budsjett`,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: `${getSiteUrl()}/preview/dottir`,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  alternates: {
    canonical: `${getSiteUrl()}/preview/dottir`,
  },
}

export default function DottirPreviewPage() {
  return <DottirLanding />
}
