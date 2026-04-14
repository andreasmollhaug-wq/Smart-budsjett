# Dokumentasjon (Smart Budsjett)

Denne mappen samler **Markdown-filer** som beskriver produktet, prising, landing, design og teknisk oversikt — komplementært til React-koden. Bruk dem som sannhetskilde når dere oppdaterer nettsiden, vilkår eller salgsmateriell; **detaljert stack, API og database** er samlet i [ARKITEKTUR.md](./ARKITEKTUR.md).

| Fil | Formål |
|-----|--------|
| [PRODUKT.md](./PRODUKT.md) | Hva produktet er, for hvem, verdiforslag og merke |
| [LANDING.md](./LANDING.md) | Struktur og budskap på forsiden (`/`, `/iris`) |
| [PRIS-OG-ABONNEMENT.md](./PRIS-OG-ABONNEMENT.md) | Planer, priser, prøveperiode, Stripe og EnkelExcel AI |
| [DEMO.md](./DEMO.md) | Idéer til demo (valgfritt neste steg) |
| [DESIGN.md](./DESIGN.md) | UI: farger, komponenter, samme stil som appen |
| [INNHOLD.md](./INNHOLD.md) | Tone og språk (bokmål, «du») |
| [DESIGN-KILDER.md](./DESIGN-KILDER.md) | Figma, logo, eksterne designkilder |
| [A11Y.md](./A11Y.md) | Tilgjengelighet — kort sjekkliste |
| [ARKITEKTUR.md](./ARKITEKTUR.md) | Next.js, Supabase, Stripe, ruter, API, migrasjoner, Vitest og Playwright (mobil som standard) |

**Juridisk innhold** skal ligge på egne sider i appen:

- `/personvern` — [`src/app/personvern/page.tsx`](../src/app/personvern/page.tsx)
- `/vilkar` — [`src/app/vilkar/page.tsx`](../src/app/vilkar/page.tsx)

Oppdater disse med fulltekst når den er klar; `docs` oppsummerer ikke sensitive juridiske detaljer.
