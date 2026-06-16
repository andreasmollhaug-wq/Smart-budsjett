/** Kundetekst for Snøball-veiledning (modal). */

export const snowballGuideDisclaimer =
  'Graf, KPI og nedbetalingsplan er veiledende estimater basert på tall du legger inn — ikke finansrådgivning.'

export const snowballGuideHero = {
  title: 'Bygg ned gjeld med en plan',
  lead: 'Betal minimum på alt. Legg ekstra der det gir mest mening — og se planen vokse med tallene dine.',
} as const

export type SnowballGuideStepCard = {
  title: string
  body: string
}

export const snowballHowToStepCards: readonly SnowballGuideStepCard[] = [
  {
    title: 'Legg inn lån',
    body: 'Under Gjeld eller «Legg til lån» her. Fyll inn restgjeld, rente og minimum per måned.',
  },
  {
    title: 'Velg hva som skal med',
    body: 'Huk av «Ta med i snøball». Boliglån er som standard utenfor — du kan overstyre.',
  },
  {
    title: 'Velg strategi',
    body: 'Snøball (minste restgjeld først) eller Avalanche (høyeste rente først).',
  },
  {
    title: 'Sett ekstra per måned',
    body: 'Et beløp du realistisk kan holde over tid — brukes i simuleringen.',
  },
  {
    title: 'Følg køen',
    body: '«Neste fokus» viser hvilket lån som får ekstra og rullet avdrag nå.',
  },
  {
    title: 'Les graf og plan',
    body: 'Juster tall til estimatene stemmer omtrent med virkeligheten.',
  },
  {
    title: 'Oppdater underveis',
    body: 'Når et lån forsvinner eller rente endres — hold Gjeld oppdatert.',
  },
] as const

export type SnowballStrategyCard = {
  title: string
  tagline: string
  points: readonly string[]
}

export const snowballStrategyCards: Record<'snowball' | 'avalanche', SnowballStrategyCard> = {
  snowball: {
    title: 'Snøball',
    tagline: 'Minste restgjeld først',
    points: [
      'Ekstra går til det minste lånet til det er borte.',
      'Avdraget ruller videre — snøballen vokser.',
      'Gir ofte rask synlig fremdrift og motivasjon.',
    ],
  },
  avalanche: {
    title: 'Avalanche',
    tagline: 'Høyeste rente først',
    points: [
      'Ekstra går til lånet med høyest rente.',
      'Kan ofte gi lavere total rentekostnad over tid.',
      'Samme minimum på alle — bare rekkefølgen endres.',
    ],
  },
} as const

export type SnowballDottirFeature = {
  title: string
  body: string
}

export const snowballDottirFeatures: readonly SnowballDottirFeature[] = [
  {
    title: 'Én gjeldliste',
    body: 'Samme lån som under Gjeld — redigeres begge steder.',
  },
  {
    title: 'Tydelig kø',
    body: 'Med i kø når «Ta med i snøball» er på, avdrag ikke er pauset, og det er restgjeld igjen.',
  },
  {
    title: 'Fokuslån',
    body: 'Første i køen får ekstra nedbetaling og rullet minimum.',
  },
  {
    title: 'Simulering',
    body: 'Graf og KPI viser estimert rente, gjeldsfri dato og effekt av ekstra avdrag.',
  },
] as const

export const snowballMethodWhen =
  'Metoden passer godt når du har flere lån og vil ha tydelig rekkefølge. Ha gjerne rom til nødfond i tillegg — uventede utgifter uten buffer kan ødelegge planen.'

export const snowballHouseholdNote =
  'Aggregert husholdning er read-only her. Bytt til én profil under «Viser data for» for å redigere gjeld, strategi og ekstra beløp.'

export const snowballArticleLink = {
  href: '/guider/snoeballmetoden-gjeld',
  label: 'Les artikkelen om snøballmetoden',
  description: 'Enkel forklaring med eksempel, grafer og tabeller — samme grunnlag som verktøyet.',
} as const

export const snowballGuideTabs = [
  { id: 'steps' as const, label: 'Kom i gang' },
  { id: 'method' as const, label: 'Metoden' },
  { id: 'dottir' as const, label: 'I Dottir' },
]

export type SnowballGuideTabId = (typeof snowballGuideTabs)[number]['id']
