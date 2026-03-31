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
]

export function isAnnouncementApplicable(a: ProductAnnouncement): boolean {
  return compareSemver(a.version, APP_VERSION) <= 0
}
