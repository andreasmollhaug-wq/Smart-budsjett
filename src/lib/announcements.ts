import { APP_VERSION, compareSemver } from '@/lib/version'

export type AnnouncementKind = 'product' | 'budget' | 'insight'

export interface ProductAnnouncement {
  /** Stabil nøkkel; brukes for å unngå duplikater og sporing i localStorage. */
  id: string
  /** Semver denne meldingen hører til (må være ≤ gjeldende app-versjon for å vises). */
  version: string
  title: string
  body: string
  kind: AnnouncementKind
}

/**
 * Legg til nye rader her ved hver release. Brukere som oppdaterer appen får varsel én gang per id.
 */
export const PRODUCT_ANNOUNCEMENTS: ProductAnnouncement[] = [
  {
    id: 'release-0.1.0',
    version: '0.1.0',
    title: 'Velkommen til Smart Budsjett v0.1',
    body:
      'Dette er første versjon du kan følge med på her. Fremover får du beskjed når det kommer nye funksjoner og forbedringer — trykk på klokken øverst til høyre for å se alt.',
    kind: 'product',
  },
  {
    id: 'release-0.2.0',
    version: '0.2.0',
    title: 'Smart Budsjett v0.2 er ute',
    body:
      'Du kjører nå en ny versjon. Sjekk ut det som er nytt i appen — og husk at du alltid finner siste beskjeder her under klokken.',
    kind: 'product',
  },
  {
    id: 'release-0.3.0',
    version: '0.3.0',
    title: 'Smart Budsjett v0.3 er ute',
    body:
      'I samlet husholdning viser transaksjonslisten nå en merkelapp med hvilken profil hver rad tilhører — enklere å holde oversikt når dere er flere.\n\nForbedret kategorivalg og filtre på transaksjoner, små justeringer i dashboard og på landingssider, og oppdaterte personvern- og vilkårstekster. Små feilrettinger og forbedringer under panseret.',
    kind: 'product',
  },
  {
    id: 'release-0.3.1',
    version: '0.3.1',
    title: 'Smart Budsjett v0.3.1 er ute',
    body:
      'Du kan nå importere transaksjoner fra CSV under Min konto → Importer transaksjoner (mal og steg-for-steg veiledning). Etter opplasting og når importen er bekreftet, får du også varsler under klokken om at data er lastet inn.\n\nDiverse små forbedringer i konto, demo og abonnement.',
    kind: 'product',
  },
  {
    id: 'release-0.3.2',
    version: '0.3.2',
    title: 'Planlagte transaksjoner og avsluttede abonnement',
    body:
      'Når du legger til et abonnement kan du nå velge «Legg også inn planlagte utgifter i transaksjoner» — da opprettes én linje per måned for resten av budsjettåret.\n\nNy fane «Avsluttede» under Abonnementer: marker abonnement som avsluttet med måned og år, så justeres budsjettet og planlagte transaksjoner automatisk. Avsluttede abonnement lagres for fremtidig besparelsesanalyse.\n\nDu kan nå trykke på en rad i abonnementlisten for å redigere — enklere å korrigere beløp, navn og innstillinger etter registrering.',
    kind: 'product',
  },
  {
    id: 'release-0.3.3',
    version: '0.3.3',
    title: 'Smart Budsjett v0.3.3 er ute — viktig fiks for CSV-import av beløp',
    body:
      'Denne oppdateringen er nå på live.\n\nVi har rettet en feil i import av transaksjoner fra CSV: beløp med norsk formattering (tusenskille og komma som desimal, f.eks. 1 050,66) ble tidligere tolket feil og kunne gi helt gale summer. Nå leser appen slike beløp korrekt og avrunder til hele kroner, som i resten av appen.\n\nHvis du har importert filer med desimaler i BELØP-kolonnen før denne versjonen, bør du sjekke transaksjonene og rette eller slette rader som ser urimelige ut. Nye importer med norsk tallformat skal stemme.\n\nTeksten på importsiden og i veiledningen er oppdatert.',
    kind: 'product',
  },
  {
    id: 'release-0.3.4',
    version: '0.3.4',
    title: 'Smart Budsjett v0.3.4 — transaksjoner og budsjettkategorier',
    body:
      'Nytt periodevalg på transaksjoner: du kan filtrere på én måned, hele budsjettåret eller «hittil i år», slik at tallene matcher det du ser i sammendrag og dashboard.\n\nPå transaksjoner og i faktisk-oversikten kan du åpne en kategori for å se underliggende transaksjoner i valgt periode, med snarvei videre til hele transaksjonslisten.\n\nSiden for budsjettkategorier (Min konto) er utvidet med bedre oversikt og kobling mot det du gjør i transaksjonsvisningen.\n\nTrykk på klokken øverst til høyre når du vil lese tidligere beskjeder.',
    kind: 'product',
  },
  {
    id: 'release-0.3.5',
    version: '0.3.5',
    title: 'Smart Budsjett v0.3.5 — månedsinnsikt og smartere AI',
    body:
      'Ny rapport Månedsinnsikt under Rapporter: få en AI-drevet oppsummering av valgt måned med budsjett mot faktisk, nøkkeltall og eksport til PDF — med tydelig husholdning kontra enkeltprofil.\n\nOppdateringer på Abonnementer og tydeligere informasjon om modulene i abonnementet.\n\nEnkel Excel AI og appens AI-hjelp bruker mer relevant brukerkontekst, slik at svarene treffer bedre.\n\nTrykk på klokken øverst til høyre for å se denne og tidligere beskjeder.',
    kind: 'product',
  },
  {
    id: 'release-0.3.6',
    version: '0.3.6',
    title: 'Smart Budsjett v0.3.6 — ny Oversikt og profiler under Min konto',
    body:
      'Oversikt (dashboard) er bygget om: velg periode (måned, hittil i år eller hele året), se «Mot budsjett», faste trekk fra budsjettet, forslag under «Dette bør du sjekke» og siste aktivitet — med tydeligere inntekt- og utgiftsgraf.\n\nHar du Familie-abonnement finner du nå Min konto → Profiler: endre navn på profiler eller fjern en ekstra profil som ble lagt inn ved en feil (sletting fjerner all data for den profilen).\n\nSmå forbedringer i AI-hjelp og i hvordan data lagres og slås sammen. Trykk på klokken øverst til høyre for å lese tidligere beskjeder.',
    kind: 'product',
  },
  {
    id: 'release-0.3.7',
    version: '0.3.7',
    title: 'Smart Budsjett v0.3.7 — ute på live',
    body:
      'Denne versjonen er rullet ut på live.\n\n' +
      'Abonnement og betaling går nå gjennom Stripe: start eller administrer under Min konto → Betalinger (14 dagers prøve der dette gjelder). ' +
      'Tilgang til å lagre budsjett og økonomidata er koblet til gyldig abonnement eller prøveperiode; fullfør betalingssteget om du ser melding om at lagring ikke er tilgjengelig.\n\n' +
      'Siden Produktflyt viser hele løpet fra budsjett og transaksjoner til oversikt, sparing og rapporter — før du logger inn. ' +
      'Landingssider, kom i gang og små forbedringer i budsjettvisning er oppdatert.\n\n' +
      'Teknisk: nye retningslinjer for tilgang i databasen (abonnementsport) og valgfri serverstyrt omdirigering til betaling når det er slått på i miljøet — i tråd med utrulling i dokumentasjonen.\n\n' +
      'Trykk på klokken øverst til høyre for å lese denne og tidligere beskjeder.',
    kind: 'product',
  },
  {
    id: 'release-0.3.8',
    version: '0.3.8',
    title: 'Smart Budsjett v0.3.8 — renovasjonsprosjekt, transaksjoner og mer',
    body:
      'Nytt internt renovasjonsprosjekt: planlegg med maler (bl.a. kjøkken og bad), forslag til budsjettlinjer og nøkkeltall — med lagring knyttet til kontoen din.\n\n' +
      'Transaksjoner er utvidet med egen visning for kommende trekk, tydeligere undernavigasjon og detaljvisning når du åpner en rad.\n\n' +
      'Egen side for gjeld, oppdaterte juridiske sider (personvern, vilkår, sikkerhet) og forbedringer på landingssider. Små tekniske oppdateringer for varsler og ruting.\n\n' +
      'Trykk på klokken øverst til høyre for å lese denne og tidligere beskjeder.',
    kind: 'product',
  },
]

export function isAnnouncementApplicable(a: ProductAnnouncement): boolean {
  return compareSemver(a.version, APP_VERSION) <= 0
}
