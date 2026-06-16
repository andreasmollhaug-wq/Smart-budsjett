import type { Metadata } from 'next'
import RecoveryHashRedirect from '@/components/auth/RecoveryHashRedirect'
import DottirLandingV2 from '@/components/marketing/DottirLandingV2'
import { TRIAL_OFFER_META_LINE } from '@/lib/marketing/trialCampaignCopy'
import { getSiteUrl } from '@/lib/site-url'

/** Fanetittel — mal i root layout brukes ikke når `absolute` settes. */
const documentTitle = 'Dottir | Ta kontroll'
const description =
  `Dottir hjelper privatpersoner med oversikt over inntekter og utgifter — enkelt budsjettverktøy med ferdig struktur. ${TRIAL_OFFER_META_LINE}`

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
    <>
      <RecoveryHashRedirect />
      <DottirLandingV2 />
    </>
  )
}
