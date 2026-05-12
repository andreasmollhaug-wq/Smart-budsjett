import { dottirOpenGraphImageResponse } from '@/lib/marketing/dottirOgImage'

export const runtime = 'edge'

export const alt = 'Dottir — ta kontroll'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return dottirOpenGraphImageResponse({
    headline: 'Ta kontroll',
    subline:
      'Budsjett med ferdig struktur — plan, forbruk og hverdagsflyt. 14 dagers gratis prøveperiode.',
  })
}
