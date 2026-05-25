import { BOLIGLAN_KALKULATOR_HREF, STUDIELAN_KALKULATOR_HREF } from '@/lib/sidebarNav'
import type { OnboardingStatus } from '@/lib/store'

/** Rute-spesifikke forslag — korte, trykk-vennlige setninger for modal og sidebar. */
const ROUTE_SUGGESTIONS: { prefix: string; questions: string[] }[] = [
  {
    prefix: BOLIGLAN_KALKULATOR_HREF,
    questions: [
      'Hva betyr lånegrad og egenkapital her?',
      'Forklar nominell vs effektiv rente',
      'Hvordan registrerer jeg dette som boliglån i appen?',
    ],
  },
  {
    prefix: STUDIELAN_KALKULATOR_HREF,
    questions: [
      'Hva betyr rentefri periode for studielån?',
      'Hvordan lagrer jeg dette som studielån i appen?',
      'Sparer jeg mest på kortere nedbetalingstid?',
    ],
  },
  {
    prefix: '/gjeld/husholdning',
    questions: ['Forklar gjeld per person hos oss', 'Hvilket lån bør vi fokusere på?'],
  },
  {
    prefix: '/budsjett/husholdning',
    questions: ['Hvordan fordeler vi inntekt og utgifter?', 'Hvem bør justere hva i budsjettet?'],
  },
  {
    prefix: '/budsjett/dashboard',
    questions: ['Hvor avviker vi mest fra planen?', 'Hvilke kategorier bør vi se på?'],
  },
  {
    prefix: '/transaksjoner/kommende',
    questions: ['Hva gjør jeg med forfalte poster?', 'Hvordan fungerer planlagte trekk?'],
  },
  {
    prefix: '/transaksjoner/dashboard',
    questions: ['Hvor går pengene denne måneden?', 'Hvilke kategorier skiller seg ut?'],
  },
  {
    prefix: '/sparing/smartspare',
    questions: ['Forklar smartSpare-planen min', 'Hvordan endrer jeg innbetalinger?'],
  },
  {
    prefix: '/sparing/analyse',
    questions: ['Hva betyr sparetempo mot måldato?', 'Ligger vi an på sparemålene?'],
  },
  {
    prefix: '/sparing/formuebygger',
    questions: ['Hva er Formuebyggeren?', 'Hvordan skiller den seg fra sparemål?'],
  },
  {
    prefix: '/konto/kom-i-gang',
    questions: ['Hva bør jeg gjøre først?', 'Anbefalt rekkefølge for meg nå?'],
  },
  {
    prefix: '/konto/importer-transaksjoner',
    questions: ['Importere fra bankfil — hvordan?', 'Må jeg mappe kategorier selv?'],
  },
  {
    prefix: '/konto/importer-fra-regnskap',
    questions: ['Koble regnskapskonto til budsjett', 'Hva skjer etter jeg importerer?'],
  },
  {
    prefix: '/prosjekt',
    questions: ['Oppussing vs vanlig budsjett — forskjellen?', 'Hvordan lager jeg rom under et prosjekt?'],
  },
  {
    prefix: '/forum',
    questions: ['Hva kan jeg bruke forumet til?', 'Hvordan endrer jeg visningsnavn?'],
  },
  {
    prefix: '/hjemflyt',
    questions: ['Hvordan fungerer HjemFlyt for barn?', 'Sette opp oppgaver og poeng'],
  },
  {
    prefix: '/intern/mat-handleliste',
    questions: ['Planlegge ukehandel — hvor starter jeg?', 'Kan handlelisten deles?'],
  },
  {
    prefix: '/dashboard',
    questions: ['Oppsummer måneden kort', 'Hva skiller seg ut i tallene?'],
  },
  {
    prefix: '/budsjett',
    questions: ['Hvor avviker jeg fra budsjettet?', 'Hvilke linjer bør jeg justere?'],
  },
  {
    prefix: '/transaksjoner',
    questions: ['Hvor går pengene?', 'Hvilke kategorier avviker mest?'],
  },
  {
    prefix: '/gjeld',
    questions: ['Hvilken gjeld bør jeg prioritere?', 'Forklar snøball med mine tall'],
  },
  {
    prefix: '/snoball',
    questions: ['Passer snøball eller avalanche for meg?', 'Hva sparer jeg mest på ekstra avdrag?'],
  },
  {
    prefix: '/sparing',
    questions: ['Hvordan ligger jeg an på sparemål?', 'Hva bør jeg prioritere nå?'],
  },
  {
    prefix: '/abonnementer',
    questions: ['Total abonnementskostnad per måned?', 'Overlapp mellom profiler i husholdningen?'],
  },
  {
    prefix: '/investering',
    questions: ['Kort oversikt over porteføljen min', 'Hva betyr avviket i tallene?'],
  },
  {
    prefix: '/rapporter',
    questions: ['Hva bør med i bankrapporten?', 'Oppsummer nøkkeltall for meg'],
  },
  {
    prefix: '/konto/betalinger',
    questions: ['Hvordan sier jeg opp abonnementet?', 'Hva inkluderer planen min?'],
  },
  {
    prefix: '/konto/innstillinger',
    questions: ['Demodata og startveiledning — hvor?', 'Bytte mellom enkel og detaljert meny'],
  },
]

const ROUTES_BY_SPECIFICITY = [...ROUTE_SUGGESTIONS].sort(
  (a, b) => b.prefix.length - a.prefix.length,
)

export function routeSuggestionsForPath(pathname: string): string[] {
  const match = ROUTES_BY_SPECIFICITY.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  return match?.questions ?? []
}

export function hasRouteSpecificSuggestions(pathname: string): boolean {
  return routeSuggestionsForPath(pathname).length > 0
}

export type DottirAiUserSnapshot = {
  transactionCount: number
  debtCount: number
  savingsGoalCount: number
  budgetLinesWithAmount: number
  serviceSubscriptionCount: number
  investmentCount: number
  checklistOpenCount: number
  onboardingStatus: OnboardingStatus
  demoDataEnabled: boolean
  isHouseholdAggregate: boolean
}

/** Forslag når brukeren har lite data — hjelper dem i gang. */
export function activityGapSuggestions(snapshot: DottirAiUserSnapshot): string[] {
  const out: string[] = []

  if (snapshot.onboardingStatus === 'pending') {
    out.push('Jeg er ny — hva er smart å gjøre først?')
  }

  if (snapshot.transactionCount === 0 && !snapshot.demoDataEnabled) {
    out.push('Hvor legger jeg inn transaksjoner?')
  }

  if (snapshot.budgetLinesWithAmount <= 2 && !snapshot.demoDataEnabled) {
    out.push('Hva bør inn i budsjettet først?')
  }

  if (snapshot.checklistOpenCount >= 3 && snapshot.budgetLinesWithAmount < 8) {
    out.push('Hva mangler i budsjett-oppsettet mitt?')
  }

  if (
    snapshot.debtCount === 0 &&
    snapshot.savingsGoalCount === 0 &&
    snapshot.transactionCount > 0 &&
    !snapshot.demoDataEnabled
  ) {
    out.push('Er det på tide med gjeld eller sparemål?')
  }

  if (snapshot.serviceSubscriptionCount === 0 && snapshot.transactionCount >= 5) {
    out.push('Registrere faste abonnementer (Netflix osv.)')
  }

  if (snapshot.isHouseholdAggregate && snapshot.transactionCount > 0) {
    out.push('Hvordan leser jeg tall for hele husholdningen?')
  }

  return out
}

export function mergeContextualSuggestions(
  pathname: string,
  snapshot: DottirAiUserSnapshot,
  generic: readonly string[],
  max = 6,
): string[] {
  const route = routeSuggestionsForPath(pathname)
  const gaps = activityGapSuggestions(snapshot)

  const seen = new Set<string>()
  const out: string[] = []

  const push = (q: string) => {
    if (seen.has(q)) return
    seen.add(q)
    out.push(q)
  }

  for (const q of route) {
    push(q)
    if (out.length >= max) return out
  }

  for (const q of gaps) {
    push(q)
    if (out.length >= max) return out
  }

  for (const q of generic) {
    push(q)
    if (out.length >= max) return out
  }

  return out
}

/** @deprecated Bruk mergeContextualSuggestions */
export function mergeCompactSuggestions(pathname: string, generic: string[], max = 6): string[] {
  const emptySnapshot: DottirAiUserSnapshot = {
    transactionCount: 0,
    debtCount: 0,
    savingsGoalCount: 0,
    budgetLinesWithAmount: 0,
    serviceSubscriptionCount: 0,
    investmentCount: 0,
    checklistOpenCount: 0,
    onboardingStatus: 'completed',
    demoDataEnabled: false,
    isHouseholdAggregate: false,
  }
  return mergeContextualSuggestions(pathname, emptySnapshot, generic, max)
}
