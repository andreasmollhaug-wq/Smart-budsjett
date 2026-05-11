import type { Metadata } from 'next'
import DottirOmOssPage from '@/components/marketing/DottirOmOssPage'
import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'
import { DOTTIR_OM_OSS_HREF } from '@/components/marketing/constants'
import { getSiteUrl } from '@/lib/site-url'

const title = 'Om oss'
const description =
  'Hvem står bak Dottir — teamet, Dottir, EnkelExcel og samarbeidet med Iris Eyfjord.'

const canonical = `${getSiteUrl()}${DOTTIR_OM_OSS_HREF}`

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

export default function OmOssPage() {
  return (
    <DottirSmoothScroll>
      <DottirOmOssPage />
    </DottirSmoothScroll>
  )
}
