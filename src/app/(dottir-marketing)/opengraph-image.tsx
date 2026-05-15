import { dottirOpenGraphImageResponse } from '@/lib/marketing/dottirOgImage'
import { TRIAL_OFFER_META_LINE } from '@/lib/marketing/trialCampaignCopy'

export const runtime = 'edge'

export const alt = 'Dottir — ta kontroll'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return dottirOpenGraphImageResponse({
    headline: 'Ta kontroll',
    subline: `Budsjett med ferdig struktur — plan, forbruk og hverdagsflyt. ${TRIAL_OFFER_META_LINE}`,
  })
}
