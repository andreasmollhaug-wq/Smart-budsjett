import type { LandingPlanId } from '@/components/marketing/landingPricingPlans'

export type LandingPlanDetailSection = {
  title: string
  items: readonly string[]
}

export type LandingPlanDetailContent = {
  id: LandingPlanId
  modalTitle: string
  intro: string
  profileHighlight: string
  sections: readonly LandingPlanDetailSection[]
  footnote: string
}

const SHARED_APP_SECTIONS: readonly LandingPlanDetailSection[] = [
  {
    title: 'Økonomi og oversikt',
    items: [
      'Dashboard med hovedtall, trender og «brukt mot plan»',
      'Budsjett med ferdig struktur — tilpass inntekter, utgifter, gjeld og sparing',
      'Transaksjoner for faktisk forbruk, kategorier og import fra fil',
      'Sparing, sparemål og formuebygger',
      'Gjeld, nedbetaling og snøball-strategi',
      'Abonnementer — oversikt over faste trekk',
      'Investering og langsiktig sparing i samme helhet',
    ],
  },
  {
    title: 'Innsikt og hjelp',
    items: [
      'Rapporter og månedsinnsikt',
      'dottir AI — spør om tall, budsjett og appen på norsk',
      'Kommende betalinger og planlagte poster',
    ],
  },
  {
    title: 'Hverdag og samarbeid',
    items: [
      'Hjemflyt — oppgaver og rutiner i husholdningen',
      'Mat-handleliste og planlegging',
      'Oppussingsprosjekter med delmål og oversikt',
      'Forum for spørsmål og erfaringer',
    ],
  },
  {
    title: 'Konto og trygghet',
    items: [
      'Min konto — profiler, innstillinger og sikkerhet (inkl. tofaktor)',
      'Selvbetjent abonnement via Stripe',
      'Data lagres trygt — se personvern og sikkerhet på nettsiden',
    ],
  },
] as const

export const LANDING_PLAN_DETAILS: Record<LandingPlanId, LandingPlanDetailContent> = {
  solo: {
    id: 'solo',
    modalTitle: 'Solo — detaljer',
    intro:
      'Solo er for deg som styrer økonomien alene. Du får full tilgang til hele Dottir — én profil, én oversikt, alt samlet.',
    profileHighlight: 'Én brukerprofil under din konto.',
    sections: [
      {
        title: 'Dette er inkludert',
        items: ['Alt under — samme app-funksjonalitet som Familie, tilpasset én person.'],
      },
      ...SHARED_APP_SECTIONS,
      {
        title: 'Passer spesielt godt når',
        items: [
          'Du bor alene eller vil ha én privat økonomioversikt',
          'Du vil ha mer enn bankappen, uten Excel-arbeid',
          'Du vil starte enkelt og bygge vaner over tid',
        ],
      },
    ],
    footnote:
      'Trenger dere flere profiler i samme husholdning senere, kan du oppgradere til Familie fra Betalinger i appen.',
  },
  family: {
    id: 'family',
    modalTitle: 'Familie — detaljer',
    intro:
      'Familie er for to eller flere i samme husholdning. Samme fullverdige app — med opptil fem profiler og felles oversikt når dere vil se helheten.',
    profileHighlight: 'Opptil fem brukerprofiler under én innlogging (én e-post).',
    sections: [
      {
        title: 'I tillegg til Solo',
        items: [
          'Flere profiler — f.eks. partner, barn eller andre dere bor med',
          'Bytt profil eller se summert husholdning i «Viser data for»',
          'Abonnementer og transaksjoner kan merkes med hvem de gjelder',
          'dottir AI tilpasses aktiv profil eller husholdningsmodus',
        ],
      },
      ...SHARED_APP_SECTIONS,
      {
        title: 'Passer spesielt godt når',
        items: [
          'Dere vil dele økonomioversikt uten å dele passord',
          'Par eller familier som vil samarbeide om budsjett og hverdagsrutiner',
          'Noen vil se egne tall, andre vil se totalen for hjemmet',
        ],
      },
    ],
    footnote:
      'Funksjonelt innhold er likt på begge planer — forskjellen er antall profiler og husholdningsvisning.',
  },
}

export function getLandingPlanDetails(planId: LandingPlanId): LandingPlanDetailContent {
  return LANDING_PLAN_DETAILS[planId]
}
