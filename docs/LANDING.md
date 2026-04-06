# Landingsside (`/` og `/iris`) — struktur og budskap

Implementasjon: [`src/app/page.tsx`](../src/app/page.tsx), [`src/app/iris/page.tsx`](../src/app/iris/page.tsx), og delt innhold i [`src/components/marketing/`](../src/components/marketing/) (samlet i `LandingMain.tsx`).

## Teknisk kontekst

- Markedsføringssider har **ikke** app-sidebar. App ligger i route group **`(app)`** og krever innlogging (Supabase) — f.eks. `/dashboard`.
- Primær-CTA: **`CTA_HREF`** → [`/registrer`](../src/components/marketing/constants.ts). Innlogging: **`LOGIN_HREF`** → `/logg-inn`.
- **`/iris`**: Kampanjeinngang med `variant="partnerCampaign"` — samme produktbudskap i hero, partnerskap med Iris **høyere** i siden; Iris fremstår som partner, ikke som nettstedets eier.
- Query **`?ref=iris`** på `/` redirectes til **`/iris`** ([`middleware.ts`](../src/middleware.ts)).

## Seksjoner — standard (`/`)

1. **Sticky header** — Logo, anker til `#funksjoner`, `#priser`, `#faq` (større skjermer), «Logg inn», CTA «Start gratis prøveperiode».
2. **Hero** — Hovedbudskap (Smart Budsjett først), prøveperiode, kort; diskret linje med lenke til `#partnerskap` (Iris som partner).
3. **For hvem** — Tre kort.
4. **Verdiforslag** — Fire kort («Hva du får med Smart Budsjett»).
5. **Alt i appen** — `#funksjoner`: moduler som beskrevet i [`LandingAppFeatures.tsx`](../src/components/marketing/LandingAppFeatures.tsx) (samme rekkefølge som i app-menyen der det er naturlig):
   - **Oversikt** (dashboard)
   - **Budsjett**
   - **Transaksjoner**
   - **Sparing**
   - **Gjeld**
   - **Snøball**
   - **Investering**
   - **Rapporter**
   - **EnkelExcel AI**
6. **Posisjonering** — Ikke avansert økonomistyring.
7. **Slik fungerer det** — Fire steg.
8. **Produktglimt** — Illustrasjon (erstatt gjerne med ekte skjermbilder).
9. **Partnerskap Iris** — `#partnerskap`.
10. **Priser** — `#priser` — se [PRIS-OG-ABONNEMENT.md](./PRIS-OG-ABONNEMENT.md).
11. **FAQ** — `#faq`.
12. **Trygghet** — Lenker til `/personvern` og `/vilkar`.
13. **Avsluttende CTA**.
14. **Footer** — Personvern, vilkår, «Kom i gang», «Logg inn».

## Seksjoner — kampanje (`/iris`)

Samme seksjoner som over, men **Partnerskap Iris** kommer **rett etter hero** (ingen duplikat lenger ned).

## Metadata (SEO)

- `metadata` i `page.tsx` / `iris/page.tsx`: beskrivelse, **Open Graph**, **Twitter**, **canonical**.
- Sett **`NEXT_PUBLIC_APP_URL`** i produksjon (full URL uten trailing slash) slik at OG-URL og canonical blir riktige — se [.env.example](../.env.example).

## Videre forbedringer (valgfritt)

- Ekte skjermbilder eller video i produktglimt.
- Oppdater kontakt e-post i footer når endelig adresse er klar.
- Juridisk gjennomgått tekst på personvern og vilkår.
