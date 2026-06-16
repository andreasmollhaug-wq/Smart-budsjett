import { computeRegistryOverview } from './aggregate'
import type { CreditorRegistryGroup } from './types'

/** Fiktiv oversikt — kun for veiledning, ikke brukerens data. */
export const CREDITOR_REGISTRY_DEMO_CREDITORS: CreditorRegistryGroup[] = [
  {
    id: 'demo-dnb',
    name: 'DNB',
    loans: [
      {
        id: 'demo-dnb-1',
        name: 'Boliglån',
        remainingAmount: 2_850_000,
        monthlyPayment: 14_200,
        interestRate: 4.2,
        type: 'mortgage',
      },
      {
        id: 'demo-dnb-2',
        name: 'Kredittkort',
        remainingAmount: 18_500,
        monthlyPayment: 750,
        interestRate: 22,
        type: 'credit_card',
      },
    ],
  },
  {
    id: 'demo-svea',
    name: 'SVEA',
    loans: [
      {
        id: 'demo-svea-1',
        name: 'Forbrukslån',
        remainingAmount: 45_000,
        monthlyPayment: 1_850,
        interestRate: 8.9,
        type: 'consumer_loan',
      },
      {
        id: 'demo-svea-2',
        name: 'Refinansiering',
        remainingAmount: 120_000,
        monthlyPayment: 2_400,
        interestRate: 6.5,
        type: 'refinancing',
      },
    ],
  },
  {
    id: 'demo-lanekasse',
    name: 'Statens lånekasse',
    loans: [
      {
        id: 'demo-lk-1',
        name: 'Studielån',
        remainingAmount: 185_000,
        monthlyPayment: 1_200,
        interestRate: 3.1,
        type: 'student_loan',
      },
    ],
  },
]

export const CREDITOR_REGISTRY_DEMO_OVERVIEW = computeRegistryOverview(CREDITOR_REGISTRY_DEMO_CREDITORS)

/** Hvilken kreditor som vises utvidet i demo-preview. */
export const CREDITOR_REGISTRY_DEMO_EXPANDED_ID = 'demo-dnb'

export const creditorRegistryDemoCopy = {
  intro:
    'Oversikt gjeld samler lån etter kreditor — bank, finansieringsselskap eller annen långiver. Du får subtotaler per kreditor og kan åpne hvert lån for detaljer.',
  standaloneNote:
    'Modulen er frittstående per profil og er ikke koblet til Gjeld → Oversikt, Snøball eller budsjettet ennå. Tall her påvirker ikke andre moduler.',
  howTo: [
    'Legg til kreditorer (f.eks. DNB, SVEA) og registrer lån under hver.',
    'Trykk på en kreditor for å se enkelte lån og subtotaler.',
    'Sorter listen etter navn, restgjeld, rente eller månedlig avdrag.',
    'Følg «Kom i gang»-sjekklisten til oversikten er komplett.',
  ],
  demoBanner:
    'Laget for å vise hvordan en ferdig oversikt kan se ut. Dine egne tall registrerer du under.',
} as const
