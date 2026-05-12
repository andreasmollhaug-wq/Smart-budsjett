import { dottirOpenGraphImageResponse } from '@/lib/marketing/dottirOgImage'

export const runtime = 'edge'

export const alt = 'Utforsk alt — Dottir'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return dottirOpenGraphImageResponse({
    headline: 'Utforsk alt',
    subline: 'Moduler for økonomi, hverdag og innsikt — samlet i én rolig flyt.',
  })
}
