# Landingsside (`/` og `/iris`) — struktur og budskap

Implementasjon: [`src/app/page.tsx`](../src/app/page.tsx), [`src/app/iris/page.tsx`](../src/app/iris/page.tsx), og delt innhold i [`src/components/marketing/`](../src/components/marketing/) (samlet i `LandingMain.tsx`).

## Teknisk kontekst

- Markedsføringssider har **ikke** app-sidebar. App ligger i route group **`(app)`** og krever innlogging (Supabase) — f.eks. `/dashboard`.
- Primær-CTA: **`CTA_HREF`** → [`/registrer`](../src/components/marketing/constants.ts). Innlogging: **`LOGIN_HREF`** → `/logg-inn`.
- **`/iris`**: Kampanjeinngang med `variant="partnerCampaign"` — samme produktbudskap i hero, partnerskap med Iris **høyere** i siden; Iris fremstår som partner, ikke som nettstedets eier.
- Query **`?ref=iris`** på `/` redirectes til **`/iris`** ([`middleware.ts`](../src/middleware.ts)).

## Seksjoner — standard (`/`)

1. **Sticky header** — Logo, anker til `#produkt`, `#slik-fungerer`, `#funksjoner`, `#priser`, `#faq` (større skjermer), lenker til `/produktflyt` og `/guider`, «Logg inn», CTA «Start gratis prøveperiode».
2. **Hero** — Utfallsorientert H1, prøveperiode-badge, kort om kortregistrering med lenke til **`#faq-betalingskort`**; diskret linje med lenke til `#partnerskap` (Iris som partner) på standardvariant.
3. **For hvem** — Tre kort.
4. **Verdiforslag** — Fire kort («Hva du får med Smart Budsjett»).
5. **Produktglimt** — `#produkt`: faner med bilder fra [`public/marketing/`](../public/marketing/) (`oversikt.svg`, `budsjett.svg`, `transaksjoner.svg`). Erstatt med ekte skjermbilder (samme filnavn eller tilpass `LandingProductPreview.tsx`) når de er klare.
6. **Slik fungerer det** — `#slik-fungerer`: fire steg; lenke til `/produktflyt`.
7. **Funksjoner i Smart Budsjett** — `#funksjoner`: moduler i [`LandingAppFeatures.tsx`](../src/components/marketing/LandingAppFeatures.tsx), gruppert som «Det meste starter her» (Oversikt, Budsjett, Transaksjoner, Sparing) og «Mer i Smart Budsjett» (øvrige). Klikk åpner dialog med detaljer.
8. **Posisjonering** — Ikke avansert økonomistyring.
9. **Partnerskap Iris** — `#partnerskap`.
10. **Priser** — `#priser` — se [PRIS-OG-ABONNEMENT.md](./PRIS-OG-ABONNEMENT.md).
11. **FAQ** — `#faq`; første spørsmål har anker **`#faq-betalingskort`** (kort / prøveperiode).
12. **Trygghet** — Lenker til `/sikkerhet`, `/personvern` og `/vilkar`.
13. **Avsluttende CTA**.
14. **Footer** — Personvern, sikkerhet, vilkår, «Kom i gang», «Logg inn».

## Seksjoner — kampanje (`/iris`)

Samme seksjoner som over, men **Partnerskap Iris** kommer **rett etter hero** (ingen duplikat lenger ned).

## Metadata (SEO)

- `metadata` i `page.tsx` / `iris/page.tsx`: beskrivelse, **Open Graph**, **Twitter**, **canonical**.
- Sett **`NEXT_PUBLIC_APP_URL`** i produksjon (full URL uten trailing slash) slik at OG-URL og canonical blir riktige — se [.env.example](../.env.example).

## Videre forbedringer (valgfritt)

- Bytt ut markedsførings-SVG-ene i `public/marketing/` med ekte skjermbilder eller kort video.
- Oppdater kontakt e-post i footer når endelig adresse er klar.
- Juridisk gjennomgått tekst på personvern og vilkår.
