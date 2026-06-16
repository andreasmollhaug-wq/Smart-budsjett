/**
 * Felles kildetekst for snøball-artikkel, veiledningsmodal og verktøy.
 * Hold i sync med snowballGuideCopy.ts og snowballStrategyCompareDemo.
 */

export const snowballArticleMeta = {
  title: 'Snøballmetoden og Avalanche: en enkel plan for nedbetaling',
  description:
    'Forstå Snøball og Avalanche med enkle ord, tabeller og eksempel — og bruk det samme opplegget i Dottir når du er klar.',
} as const

export const snowballArticleSections = {
  intro: {
    title: 'En enkel idé',
    lead:
      'Du har flere lån. Hver måned betaler du minimum på alle — og legger ekstra på **ett** lån om gangen til det er borte. Deretter ruller du avdraget videre til neste. Forskjellen mellom Snøball og Avalanche er bare **hvilken rekkefølge** du velger.',
  },
  snowball: {
    title: 'Snøball — minste restgjeld først',
    points: [
      'Ekstra går til det lånet med **minst restgjeld**.',
      'Når det er borte, ruller du hele avdraget dit inn på neste minste.',
      'Du får ofte **rask synlig fremdrift** — en hel gjeld borte gir motivasjon.',
    ],
    bestFor: 'Passer godt når du trenger tidlige «seire» og flere små krav.',
  },
  avalanche: {
    title: 'Avalanche — høyeste rente først',
    points: [
      'Ekstra går til lånet med **høyest rente**.',
      'Minimum betaler du fortsatt på alt — bare rekkefølgen på ekstra endres.',
      'Kan ofte gi **lavere total rentekostnad** over tid.',
    ],
    bestFor: 'Passer godt når du vil minimere renter og tåler at større lån tar lengre tid.',
  },
  howItWorks: {
    title: 'Slik fungerer det i praksis',
    steps: [
      'List opp lånene dine med restgjeld, rente og minimum per måned.',
      'Bestem hvor mye **ekstra** du kan legge på hver måned — realistisk over tid.',
      'Velg Snøball eller Avalanche for rekkefølgen på ekstra.',
      'Betal minimum på alt. Alt ekstra + rullet avdrag går til **fokuslånet**.',
      'Når et lån er borte, starter du på neste i køen — snøballen vokser.',
    ],
  },
  example: {
    title: 'Eksempel: tre lån og 2 000 kr ekstra',
    lead:
      'Tallene er et **fiktivt eksempel** der metodene faktisk velger **ulik rekkefølge**: Snøball betaler det minste lånet først, Avalanche kredittkortet med høyest rente. Da ser du forskjell i total rente og i grafene.',
  },
  inDottir: {
    title: 'I Dottir',
    points: [
      '**Gjeld** — registrer lån med restgjeld, rente og avdrag.',
      '**Snøball** — velg strategi, sett ekstra beløp, se kø, graf og plan.',
      'Huk av «Ta med i snøball» på lån du vil ha med (boliglån er ofte utenfor som standard).',
      '«Slik fungerer snøball» på Snøball-siden forklarer verktøyet steg for steg.',
    ],
  },
  watchOut: {
    title: 'Dette bør du huske',
    items: [
      'Graf og tabeller er **veiledende estimater** — ikke finansrådgivning.',
      'Ha gjerne **nødfond** i tillegg; uventede utgifter uten buffer kan ødelegge planen.',
      'Hold tallene oppdatert når rente eller restgjeld endres.',
    ],
  },
  disclaimer:
    'Eksempel og simuleringer i Dottir er forenklet modell — faktiske avdrag og renter kan avvike. Ved store valg: snakk med bank eller rådgiver.',
} as const
