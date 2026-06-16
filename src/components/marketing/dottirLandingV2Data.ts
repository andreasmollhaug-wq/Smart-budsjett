import { Brain, Home, Layers, TrendingUp } from 'lucide-react'

export const V2_HERO = {
  badge: 'Budsjett, transaksjoner og hverdagen — samlet',
  titleLine1: 'Få kontroll på økonomien',
  titleLine2: 'ett steg av gangen',
  subtitle:
    'Dottir gir deg ferdig struktur på inntekter og utgifter, slik at du ser hva du har igjen — uten Excel og uten finansjargon.',
} as const

export const V2_PAIN_POINTS = [
  {
    title: 'Pengene «forsvinner»',
    text: 'Ikke fordi du ikke kan økonomi — men fordi livet skjer mellom to bankutsagn.',
  },
  {
    title: 'Budsjettet gir seg',
    text: 'For store ambisjoner på én kveld gir lite rom for de små justeringene som faktisk holder.',
  },
  {
    title: 'Ingen felles oversikt',
    text: 'Dere i husholdningen trenger ett sted for plan, forbruk og hverdagsrutiner.',
  },
] as const

export const V2_PAIN_CLOSING =
  'Dottir er bygget for det — plan, faktisk forbruk og hverdagsrutiner i én flyt.'

export const V2_PRODUCT_PILLARS = [
  {
    icon: Layers,
    title: 'Økonomi og oversikt',
    text: 'Struktur på inntekter og utgifter — tydelig bilde av hvordan pengene brukes.',
  },
  {
    icon: TrendingUp,
    title: 'Gjeld og sparing',
    text: 'Nedbetaling, mål og smartere valg for veien videre.',
  },
  {
    icon: Home,
    title: 'Husholdning',
    text: 'Fellesskap rundt økonomi — flere profiler, én oversikt.',
  },
  {
    icon: Brain,
    title: 'Innsikt og hjelp',
    text: 'Rapporter og dottir AI du faktisk kan bruke i hverdagen.',
  },
] as const

export const V2_PRODUCT_MODULES = [
  'Budsjett og transaksjoner',
  'Gjeld og sparing',
  'Abonnementer og oversikt',
  'Husholdning (flere profiler)',
  'dottir AI — si det, bekreft, ferdig',
] as const

export const V2_VALUE_CHAIN = ['Oversikt', 'Struktur', 'Handling', 'Kontroll'] as const

export const V2_DIFFERENTIATORS = [
  'Alt samlet — ikke spredt på apper og ark.',
  'Ferdig oppsett — kom i gang uten regneark-kurs.',
  'For deg alene og for dere som deler husholdning.',
] as const

export const V2_VISION =
  'Vi vil gjøre økonomistyring enkelt nok til at det blir en naturlig del av hverdagen.'
