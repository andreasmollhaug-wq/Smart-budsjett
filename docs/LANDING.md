# Landingsside (`/` og `/iris`) — struktur og budskap

Implementasjon:

- **`/`** — [`src/app/(dottir-marketing)/page.tsx`](../src/app/(dottir-marketing)/page.tsx) → [`DottirLanding.tsx`](../src/components/marketing/DottirLanding.tsx) (hero, innholdsseksjoner, pris, FAQ).
- **`/iris`** — [`src/app/iris/page.tsx`](../src/app/iris/page.tsx) → [`LandingMain.tsx`](../src/components/marketing/LandingMain.tsx) (klassisk kampanjelanding).

Pris og FAQ deles mellom begge via [`LandingPricing.tsx`](../src/components/marketing/LandingPricing.tsx) og [`LandingFAQ.tsx`](../src/components/marketing/LandingFAQ.tsx). Se [PRIS-OG-ABONNEMENT.md](./PRIS-OG-ABONNEMENT.md).

## Teknisk kontekst

- Markedsføringssider har **ikke** app-sidebar. App ligger i route group **`(app)`** og krever innlogging (Supabase) — f.eks. `/dashboard`.
- Primær-CTA: **`CTA_HREF`** → [`/registrer`](../src/components/marketing/constants.ts). Innlogging: **`LOGIN_HREF`** → `/logg-inn`.
- **`/iris`**: Kampanjeinngang med `variant="partnerCampaign"` — samme produktbudskap i hero, partnerskap med Iris **høyere** i siden; Iris fremstår som partner, ikke som nettstedets eier.
- Query **`?ref=iris`** på `/` redirectes til **`/iris`** ([`middleware.ts`](../src/middleware.ts)).

## Seksjoner — Dottir-forside (`/`)

1. **Sticky header** — Logo, «Produktet», «Om oss», «Logg inn», hamburger/«Mer» (bl.a. `#priser`, `#faq`, `#kjerne`, `#problem`, `#verdi`, `#malgruppe`), CTA «Start gratis prøveperiode».
2. **Hero** — Split-layout med H1, prøveperiode-badge, CTA «Start gratis prøveperiode», «Se priser» (`#priser`), «Hvem står bak dette?»; lenke til **`#faq-betalingskort`** i prøveperiode-tekst.
3. **Sitat / grep** — Tre korte story beats.
4. **Navnet og tanken** — `#kjerne`.
5. **Hva Dottir er ment å være** — `#produkt`: pilarer, modulliste, lenke til `/utforsk`.
6. **Problem Dottir adresserer** — `#problem`.
7. **Fra oversikt til kontroll** — `#verdi`.
8. **Hvorfor ikke bare «enda en app»** — differensiatorer.
9. **Målgruppe** — `#malgruppe`.
10. **Priser** — `#priser`: Solo/Familie via `LandingPricing`.
11. **FAQ** — `#faq`; spørsmål om kort har anker **`#faq-betalingskort`**.
12. **Tone og retning** — Kommunikasjonsretning (internt/design-notat).
13. **Visjon / avsluttende CTA** — «Start gratis prøveperiode», «Om oss», «Logg inn».
14. **Footer** — Om oss, Utforsk alt, personvern, sikkerhet, vilkår, «Kom i gang», «Logg inn».

## Seksjoner — kampanje (`/iris`)

[`LandingMain.tsx`](../src/components/marketing/LandingMain.tsx): hero, for hvem, verdiforslag, produktglimt, slik fungerer det, funksjoner, posisjonering, partnerskap Iris (høyere på siden), **priser** (`#priser`), **FAQ** (`#faq`), trygghet, avsluttende CTA, footer.

## Metadata (SEO)

- `metadata` i `(dottir-marketing)/page.tsx` / `iris/page.tsx`: beskrivelse, **Open Graph**, **Twitter**, **canonical**.
- Sett **`NEXT_PUBLIC_APP_URL`** i produksjon (full URL uten trailing slash) slik at OG-URL og canonical blir riktige — se [.env.example](../.env.example).

## Videre forbedringer (valgfritt)

- Bytt ut markedsførings-SVG-ene i `public/marketing/` med ekte skjermbilder eller kort video.
- Oppdater kontakt e-post i footer når endelig adresse er klar.
- Juridisk gjennomgått tekst på personvern og vilkår.
