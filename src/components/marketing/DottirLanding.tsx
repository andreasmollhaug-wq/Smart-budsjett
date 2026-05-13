'use client'

import DottirLandingHeader from '@/components/marketing/DottirLandingHeader'
import DottirLandingHeroSplit from '@/components/marketing/DottirLandingHeroSplit'
import DottirLandingSections from '@/components/marketing/DottirLandingSections'
import LandingFooter from '@/components/marketing/LandingFooter'
import { DOTTIR_PARTNER_HERO_IMAGE } from '@/components/marketing/partnerLandingConfig'

export default function DottirLanding() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <DottirLandingHeader variant="centerNav" />
      <main>
        <DottirLandingHeroSplit heroImageSrc={DOTTIR_PARTNER_HERO_IMAGE} />
        <DottirLandingSections />
      </main>
      <LandingFooter variant="dottir" />
    </div>
  )
}
