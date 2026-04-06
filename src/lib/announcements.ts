import { APP_VERSION, compareSemver } from '@/lib/version'

export type AnnouncementKind = 'product' | 'budget'

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
]

export function isAnnouncementApplicable(a: ProductAnnouncement): boolean {
  return compareSemver(a.version, APP_VERSION) <= 0
}
