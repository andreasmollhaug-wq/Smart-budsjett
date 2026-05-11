import type { Metadata } from 'next'
import DottirUtforskPage from '@/components/marketing/DottirUtforskPage'
import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'
import { DOTTIR_UTFORSK_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Utforsk alt'
const description =
  'Se alle modulene i Dottir — økonomi, hverdag og innsikt — samlet på én rolig flyt.'

const canonical = `${getSiteUrl()}${DOTTIR_UTFORSK_HREF}`

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
  alternates: {
    canonical,
  },
}

export default function UtforskPage() {
  return (
    <DottirSmoothScroll>
      <DottirUtforskPage />
    </DottirSmoothScroll>
  )
}
