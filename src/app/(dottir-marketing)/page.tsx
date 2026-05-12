import type { Metadata } from 'next'
import RecoveryHashRedirect from '@/components/auth/RecoveryHashRedirect'
import DottirLanding from '@/components/marketing/DottirLanding'
import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Enkel oversikt på økonomien'
const description =
  'Dottir hjelper privatpersoner med oversikt over inntekter og utgifter — enkelt budsjettverktøy med ferdig struktur og 14 dagers gratis prøveperiode.'

const canonical = `${getSiteUrl()}/`

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} · Dottir`,
    description,
    url: canonical,
    siteName: 'Dottir',
    locale: 'nb_NO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · Dottir`,
    description,
  },
  alternates: {
    canonical,
  },
}

export default function HomePage() {
  return (
    <DottirSmoothScroll>
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
        <RecoveryHashRedirect />
        <DottirLanding />
      </div>
    </DottirSmoothScroll>
  )
}
