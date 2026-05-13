import type { Metadata } from 'next'
import RecoveryHashRedirect from '@/components/auth/RecoveryHashRedirect'
import DottirLanding from '@/components/marketing/DottirLanding'
import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'
import { getSiteUrl } from '@/lib/site-url'

/** Fanetittel — mal i root layout brukes ikke når `absolute` settes. */
const documentTitle = 'Dottir | Ta kontroll'
const description =
  'Dottir hjelper privatpersoner med oversikt over inntekter og utgifter — enkelt budsjettverktøy med ferdig struktur og 14 dagers gratis prøveperiode.'

const canonical = `${getSiteUrl()}/`

export const metadata: Metadata = {
  title: { absolute: documentTitle },
  description,
  openGraph: {
    title: documentTitle,
    description,
    url: canonical,
    siteName: 'Dottir',
    locale: 'nb_NO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: documentTitle,
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
