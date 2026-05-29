/** Kundetekst for abonnement-veiledning (modal). */

export const subscriptionGuideDisclaimer =
  'Summene er basert på det du har registrert her — ikke en offisiell bank- eller leverandøroversikt.'

export const subscriptionGuideHero = {
  title: 'Samle faste abonnementer på ett sted',
  lead: 'Streaming, programvare og andre faste trekk — med sum per måned og per år, og valgfri kobling til budsjettet ditt.',
} as const

export type SubscriptionGuideStepCard = {
  title: string
  body: string
}

export const subscriptionHowToStepCards: readonly SubscriptionGuideStepCard[] = [
  {
    title: 'Velg tjeneste',
    body: 'Plukk fra listen (Netflix, Spotify, osv.) eller skriv navn selv.',
  },
  {
    title: 'Beløp og periode',
    body: 'Fyll inn pris i NOK og om det faktureres månedlig eller årlig.',
  },
  {
    title: 'Synk til budsjett',
    body: 'Huk av for å legge planbeløpet under Regninger — egen linje eller delt med andre abo.',
  },
  {
    title: 'Planlagte trekk (valgfritt)',
    body: 'Du kan også få planlagte utgifter i transaksjoner for valgt periode — nyttig som påminnelse.',
  },
  {
    title: 'Se oversikt',
    body: 'Under Sammendrag får du totaler og fordelt bilde. Avsluttede ligger under egen fane.',
  },
] as const

export type SubscriptionBudgetFeature = {
  title: string
  body: string
}

export const subscriptionBudgetFeatures: readonly SubscriptionBudgetFeature[] = [
  {
    title: 'Egen budsjettlinje',
    body: 'Standard: én linje under Regninger per abonnement. Linjen styres herfra — ikke manuelt i budsjettet.',
  },
  {
    title: 'Delt Regninger-linje',
    body: 'Koble flere abonnement til samme post (f.eks. «Streaming»). Summen oppdateres automatisk.',
  },
  {
    title: 'Månedlig månedsvindu',
    body: 'Velg hvilke måneder planbeløpet gjelder i budsjettåret — f.eks. kun sommerabonnement.',
  },
  {
    title: 'Årlig forfall',
    body: 'Ved årlig betaling kan du velge forfallsmåned: hele beløpet i én måned (typisk forsikring).',
  },
  {
    title: 'Planlagt vs. faktisk',
    body: 'Planlagte trekk er ikke bankimport. Faktisk forbruk i budsjett følger transaksjonene dine.',
  },
] as const

export type SubscriptionDottirFeature = {
  title: string
  body: string
}

export const subscriptionDottirFeatures: readonly SubscriptionDottirFeature[] = [
  {
    title: 'Sum per måned og år',
    body: 'KPI-kortene øverst viser total for aktive abonnement — månedlig ekvivalent og årlig sum.',
  },
  {
    title: 'Sammendrag og avsluttede',
    body: 'Sammendrag gir oversikt per profil i husholdning. Avsluttede beholder historikk.',
  },
  {
    title: 'Husholdning',
    body: 'Med flere profiler kan du få tips når samme tjeneste er registrert flere ganger — sjekk familie/delt abo.',
  },
  {
    title: 'dottir AI',
    body: 'Registrerte abonnementer kan brukes når du spør om faste kostnader i chatten.',
  },
] as const

export const subscriptionHouseholdNote =
  'Du ser samlet husholdning. Bytt til én profil under «Viser data for» for å legge inn eller redigere abonnement.'

export const subscriptionGuideTabs = [
  { id: 'steps' as const, label: 'Kom i gang' },
  { id: 'budget' as const, label: 'Budsjett' },
  { id: 'dottir' as const, label: 'I Dottir' },
]

export type SubscriptionGuideTabId = (typeof subscriptionGuideTabs)[number]['id']

export const subscriptionAddFormCollapsedHint =
  'Legg til streaming, programvare og andre faste trekk.'
