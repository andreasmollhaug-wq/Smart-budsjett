import { Brain, Home, Layers, TrendingUp } from 'lucide-react'
import {
  DOTTIR_OM_OSS_HREF,
  DOTTIR_UTFORSK_HREF,
} from '@/components/marketing/constants'

/** I header: alltid synlig (desktop). */
export const LANDING_NAV_PRODUKT = { href: '#produkt', label: 'Produktet' } as const

/** I header: hamburger / «Mer»-meny (ikke «Om oss» / «Produktet» — de står i hovedraden). */
export const LANDING_NAV_MORE = [
  { href: '#priser', label: 'Priser' },
  { href: '#faq', label: 'FAQ' },
  { href: DOTTIR_UTFORSK_HREF, label: 'Utforsk alt' },
  { href: '#kjerne', label: 'Kjerne' },
  { href: '#problem', label: 'Problem' },
  { href: '#verdi', label: 'Verdi' },
  { href: '#malgruppe', label: 'Målgruppe' },
] as const

/** Full liste i logisk rekkefølge (tidligere enkeltarray). */
export const NAV = [
  { href: DOTTIR_OM_OSS_HREF, label: 'Om oss' },
  { href: '#priser', label: 'Priser' },
  { href: '#faq', label: 'FAQ' },
  { href: DOTTIR_UTFORSK_HREF, label: 'Utforsk alt' },
  { href: '#kjerne', label: 'Kjerne' },
  LANDING_NAV_PRODUKT,
  { href: '#problem', label: 'Problem' },
  { href: '#verdi', label: 'Verdi' },
  { href: '#malgruppe', label: 'Målgruppe' },
] as const

/** Korte «grep» som gjør siden mer interessant å skanne */
export const STORY_BEATS = [
  {
    title: 'Hvor ble det av pengene?',
    text: 'Ikke fordi du ikke «kan økonomi» — men fordi livet skjer mellom to bankutsagn.',
  },
  {
    title: 'Hvorfor gir budsjett seg ofte?',
    text: 'For store ambisjoner på én kveld gir lite rom for de små justeringene som faktisk holder.',
  },
  {
    title: 'Hva hvis alt hang sammen?',
    text: 'Plan, forbruk, gjeld, sparing og hverdagsoppgaver — som ett spor du kan følge sammen med dem du bor med.',
  },
] as const

export const PRODUCT_PILLARS = [
  {
    icon: Layers,
    title: 'Økonomi og oversikt',
    text: 'Struktur på inntekter og utgifter, og tydelig bilde av hvordan pengene brukes.',
  },
  {
    icon: TrendingUp,
    title: 'Gjeld og sparing',
    text: 'Nedbetaling, mål og smartere valg for veien videre.',
  },
  {
    icon: Home,
    title: 'Husholdning og samarbeid',
    text: 'Fellesskap rundt økonomi — ikke bare tall på én skjerm.',
  },
  {
    icon: Brain,
    title: 'Innsikt og hjelp',
    text: 'Rapporter og forklaringer du faktisk kan bruke i hverdagen.',
  },
] as const

export const PRODUCT_MODULES = [
  'Budsjett (plan)',
  'Transaksjoner (faktisk bruk)',
  'Gjeld og nedbetaling',
  'Sparing og mål',
  'Abonnementer',
  'Oppgaver og rutiner',
  'AI-basert forklaring og hjelp',
] as const

export const PROBLEMS = [
  'Lite oversikt over egen økonomi — pengene «forsvinner» uten kontroll.',
  'Budsjett forsøkes, men det er vanskelig å holde ut.',
  'Verktøy er enten for enkle eller for tunge i bruk.',
  'Samarbeid om økonomi i husholdningen er krevende uten felles system.',
] as const

export const VALUE_CHAIN = ['Oversikt', 'Struktur', 'Handling', 'Forståelse', 'Kontroll'] as const

export const DIFFERENTIATORS = [
  'Flere funksjoner samlet — mindre fragmentering mellom apper og ark.',
  'Fokus på bruk i hverdagen, ikke bare historikk og grafer.',
  'Enkelt å komme i gang — strukturert nok til å gi reell verdi.',
  'Fungerer for deg alene og for dere som deler husholdning.',
  'Kobler økonomi med daglig struktur: oppgaver og rutiner.',
] as const

export const AUDIENCE_LINES = [
  'Privatpersoner som vil ha bedre oversikt.',
  'Par og familier som ønsker kontroll sammen.',
  'De som har prøvd budsjett før — og vil ha noe som holder i hverdagen.',
  'De som vil ha mer enn bankappen, men mindre tungvint enn Excel.',
] as const
