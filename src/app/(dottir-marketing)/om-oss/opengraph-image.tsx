import { dottirOpenGraphImageResponse } from '@/lib/marketing/dottirOgImage'

export const runtime = 'edge'

export const alt = 'Om oss — Dottir'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return dottirOpenGraphImageResponse({
    headline: 'Om oss',
    subline: 'Teamet bak Dottir, samarbeid med EnkelExcel og Iris Eyfjord.',
  })
}
