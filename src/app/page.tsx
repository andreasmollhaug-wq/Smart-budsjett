import type { Metadata } from 'next'
import LandingHeader from '@/components/marketing/LandingHeader'
import LandingHero from '@/components/marketing/LandingHero'
import LandingForWhom from '@/components/marketing/LandingForWhom'
import LandingValueProps from '@/components/marketing/LandingValueProps'
import LandingPositioning from '@/components/marketing/LandingPositioning'
import LandingHowItWorks from '@/components/marketing/LandingHowItWorks'
import LandingProductPreview from '@/components/marketing/LandingProductPreview'
import LandingIrisPartnership from '@/components/marketing/LandingIrisPartnership'
import LandingPricing from '@/components/marketing/LandingPricing'
import LandingFAQ from '@/components/marketing/LandingFAQ'
import LandingTrust from '@/components/marketing/LandingTrust'
import LandingFinalCTA from '@/components/marketing/LandingFinalCTA'
import LandingFooter from '@/components/marketing/LandingFooter'

export const metadata: Metadata = {
  title: 'Enkel oversikt på økonomien',
  description:
    'Smart Budsjett hjelper privatpersoner med oversikt over inntekter og utgifter — enkelt budsjettverktøy med ferdig struktur og 14 dagers gratis prøveperiode.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingForWhom />
        <LandingValueProps />
        <LandingPositioning />
        <LandingHowItWorks />
        <LandingProductPreview />
        <LandingIrisPartnership />
        <LandingPricing />
        <LandingFAQ />
        <LandingTrust />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
