export const V2_HERO = {
  titleLine1: 'Få kontroll på økonomien.',
  titleLine2: 'Ett steg av gangen.',
  subtitle:
    'Budsjett, transaksjoner, sparing og gjeld samlet på ett sted. Dottir gir deg oversikten du trenger – og veien videre når økonomien føles uoversiktlig.',
  ctaLabel: 'Kom i gang',
} as const

export const V2_UNDERSTAND_SECTION = {
  id: 'oversikt',
  headline: 'Alt du trenger for å forstå økonomien din',
  bullets: [
    'Budsjett som faktisk er enkelt å følge',
    'Full oversikt over inntekter og utgifter',
    'Følg gjeld, sparing og investeringer',
    'Se utviklingen din over tid',
  ] as const,
  screenshot: {
    src: '/marketing/oversikt%20alt%201.png',
    alt: 'Oversikt i Dottir — dashboard med hovedtall og trender.',
    width: 1905,
    height: 823,
  },
} as const

export const V2_DIFFERENTIATOR_SECTION = {
  id: 'mer-enn-budsjett',
  headline: 'Mer enn en budsjettapp',
  lead: 'Mange tjenester viser deg bare tallene.',
  body:
    'Dottir hjelper deg forstå hva tallene betyr – og hva du bør gjøre videre. Enten du vil spare mer, betale ned gjeld eller få bedre kontroll på hverdagsøkonomien.',
} as const

export const V2_GUIDE_SECTION = {
  id: 'okonomiguide',
  headline: 'Sliter du med inkasso eller betalingsproblemer?',
  intro: 'Dottirs økonomiguide hjelper deg steg for steg:',
  bullets: [
    'Få oversikt over kravene dine',
    'Prioriter riktig gjeld',
    'Lær hvilke rettigheter du har',
    'Lag en realistisk nedbetalingsplan',
    'Bygg økonomien opp igjen',
  ] as const,
  ctaLabel: 'Les guider om økonomi',
  ctaHref: '/guider',
} as const
