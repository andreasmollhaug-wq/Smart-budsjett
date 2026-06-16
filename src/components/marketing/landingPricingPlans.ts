import { TRIAL_OFFER_EXTENDED_EXPLANATION } from '@/lib/marketing/trialCampaignCopy'

export type LandingPlanId = 'solo' | 'family'

export type LandingPlan = {
  id: LandingPlanId
  name: string
  tagline: string
  priceNok: number
  features: readonly string[]
  ctaLabel: string
  highlighted?: boolean
  badge?: string
}

export const LANDING_PRICING_INTRO = `${TRIAL_OFFER_EXTENDED_EXPLANATION} Betalingskort registreres ved oppstart. Etter prøveperioden faktureres valgt plan til månedlig pris med mindre du sier opp.`

export const LANDING_PLAN_COMPARISON_NOTE =
  'Begge planer gir full tilgang til alle funksjoner i appen. Forskjellen er hvor mange profiler dere kan ha i samme husholdning.'

export const LANDING_PLANS: readonly LandingPlan[] = [
  {
    id: 'solo',
    name: 'Solo',
    tagline: 'For én person',
    priceNok: 89,
    features: ['Én brukerkonto', 'Full tilgang til alle funksjoner', 'Passer deg som styrer økonomien alene'],
    ctaLabel: 'Velg Solo',
  },
  {
    id: 'family',
    name: 'Familie',
    tagline: 'For to eller flere i samme husholdning',
    priceNok: 139,
    features: [
      'Opp til fem brukere i samme husholdning',
      'Felles oversikt og individuelle visninger',
      'Ideelt for par og familier',
    ],
    ctaLabel: 'Velg Familie',
    highlighted: true,
    badge: 'Mest valgt',
  },
] as const
