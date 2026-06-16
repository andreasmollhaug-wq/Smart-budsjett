'use client'

import DottirLandingHeader from '@/components/marketing/DottirLandingHeader'
import DottirLandingV2ContentSections from '@/components/marketing/DottirLandingV2ContentSections'
import DottirLandingV2HeroFullscreen from '@/components/marketing/DottirLandingV2HeroFullscreen'
import DottirLandingV2Pricing from '@/components/marketing/DottirLandingV2Pricing'
import LandingFAQ from '@/components/marketing/LandingFAQ'
import LandingFooter from '@/components/marketing/LandingFooter'
import { DottirSmoothScroll } from '@/components/marketing/DottirSmoothScroll'

export default function DottirLandingV2() {
  return (
    <DottirSmoothScroll>
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
        <DottirLandingHeader variant="centerNav" fadeOnScroll />
        <main>
          <DottirLandingV2HeroFullscreen />
          <DottirLandingV2ContentSections />
          <DottirLandingV2Pricing />
          <LandingFAQ />
        </main>
        <LandingFooter variant="dottir" />
      </div>
    </DottirSmoothScroll>
  )
}
