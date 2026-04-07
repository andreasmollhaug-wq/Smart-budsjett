import LandingForWhom from './LandingForWhom'
import LandingValueProps from './LandingValueProps'
import LandingAppFeatures from './LandingAppFeatures'
import LandingPositioning from './LandingPositioning'
import LandingHowItWorks from './LandingHowItWorks'
import LandingProductPreview from './LandingProductPreview'
import LandingIrisPartnership from './LandingIrisPartnership'
import LandingPricing from './LandingPricing'
import LandingFAQ from './LandingFAQ'
import LandingTrust from './LandingTrust'
import LandingFinalCTA from './LandingFinalCTA'
import LandingHero, { type LandingHeroVariant } from './LandingHero'

export type LandingMainVariant = 'default' | 'partnerCampaign'

type Props = {
  variant?: LandingMainVariant
}

export default function LandingMain({ variant = 'default' }: Props) {
  const heroVariant: LandingHeroVariant = variant
  const irisEarly = variant === 'partnerCampaign'

  return (
    <main>
      <LandingHero variant={heroVariant} />
      {irisEarly && <LandingIrisPartnership tightBottom />}
      <LandingForWhom />
      <LandingValueProps />
      <LandingAppFeatures />
      <LandingPositioning />
      <LandingHowItWorks />
      <LandingProductPreview />
      {!irisEarly && <LandingIrisPartnership />}
      <LandingPricing />
      <LandingFAQ />
      <LandingTrust />
      <LandingFinalCTA />
    </main>
  )
}
