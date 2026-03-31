# Landingsside (`/`) — struktur og budskap

Denne filen beskriver **innhold og rekkefølge** på markedsføringsforsiden. Implementasjonen ligger i [`src/app/page.tsx`](../src/app/page.tsx) og [`src/components/marketing/`](../src/components/marketing/).

## Teknisk kontekst

- Forsiden ligger på **`/`** og har **ikke** app-sidebar.
- App-sider (med sidebar) ligger i route group **`(app)`** — samme URL-er som før (f.eks. `/dashboard`).
- Primær-CTA bruker konstanten **`CTA_HREF`** i [`src/components/marketing/constants.ts`](../src/components/marketing/constants.ts) (per i dag `/dashboard` til dedikert onboarding eller betaling finnes).

## Seksjoner (rekkefølge)

1. **Sticky header** — Logo, anker til priser, «Logg inn», CTA «Start gratis prøveperiode».
2. **Hero** — Hovedbudskap, 14 dagers prøveperiode, at betalingskort registreres ved oppstart.
3. **For hvem** — Tre kort (pengene forsvinner, inntekt/utgift, bedre valg).
4. **Verdiforslag** — Fire kort (inntekter/faste kostnader; føre/kategorisere; visuelt; igjen etter kostnader).
5. **Posisjonering** — Ikke avansert økonomistyring; oversikt, kontroll, enkelt.
6. **Slik fungerer det** — Fire steg (klar struktur → tall → oversikt → juster).
7. **Produktglimt** — Statisk illustrasjon inspirert av dashboard.
8. **Priser** — Solo og Familie — se [PRIS-OG-ABONNEMENT.md](./PRIS-OG-ABONNEMENT.md).
9. **FAQ** — Prøveperiode, kort, familie-definisjon, bytte plan, oppsigelse, data.
10. **Trygghet** — Kort personvern-avsnitt med lenke til full tekst.
11. **Avsluttende CTA** — Gradient-blokk med gjentatt budskap.
12. **Footer** — Kontakt-placeholder, lenker til `/personvern` og `/vilkar`.

## Metadata (SEO)

- Tittel og beskrivelse settes i `src/app/page.tsx` (`export const metadata`).
- Rot-layout bruker `title.template` slik at undersider kan få meningsfulle fanetitler.

## Videre forbedringer (valgfritt)

- Ekte skjermbilder eller video i produktglimt.
- Dedikert innlogging-URL i stedet for «Logg inn» → dashboard.
- Juridisk gjennomgått tekst på personvern og vilkår.
