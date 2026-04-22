import type { Metadata } from 'next'
import RecoveryHashRedirect from '@/components/auth/RecoveryHashRedirect'
import LandingHeader from '@/components/marketing/LandingHeader'
import LandingMain from '@/components/marketing/LandingMain'
import LandingFooter from '@/components/marketing/LandingFooter'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Enkel oversikt på økonomien'
const description =
  'Smart Budsjett hjelper privatpersoner med oversikt over inntekter og utgifter — enkelt budsjettverktøy med ferdig struktur og 14 dagers gratis prøveperiode.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · Smart Budsjett`,
    description,
    url: `${getSiteUrl()}/`,
    siteName: 'Smart Budsjett',
    locale: 'nb_NO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · Smart Budsjett`,
    description,
  },
  alternates: {
    canonical: `${getSiteUrl()}/`,
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <RecoveryHashRedirect />
      <LandingHeader />
      <LandingMain variant="default" />
      <LandingFooter />
    </div>
  )
}
