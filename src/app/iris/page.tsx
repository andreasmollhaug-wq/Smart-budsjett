import type { Metadata } from 'next'
import LandingHeader from '@/components/marketing/LandingHeader'
import LandingMain from '@/components/marketing/LandingMain'
import LandingFooter from '@/components/marketing/LandingFooter'
import { getSiteUrl } from '@/lib/site-url'

const description =
  'Enkel oversikt på inntekter og utgifter — budsjettverktøy med ferdig struktur. I samarbeid med Iris Eyfjord og EnkelExcel.'

/** Unngå dobbel «Smart Budsjett» fra root layout title.template */
const documentTitle = 'Enkel oversikt på økonomien · Smart Budsjett'

export const metadata: Metadata = {
  title: { absolute: documentTitle },
  description,
  openGraph: {
    title: documentTitle,
    description,
    url: `${getSiteUrl()}/iris`,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: documentTitle,
    description,
  },
  alternates: {
    canonical: `${getSiteUrl()}/iris`,
  },
}

export default function IrisLandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <LandingHeader />
      <LandingMain variant="partnerCampaign" />
      <LandingFooter />
    </div>
  )
}
