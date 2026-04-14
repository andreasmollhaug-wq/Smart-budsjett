# Smart Budsjett

Enkel og strukturert budsjettapp for privatpersoner — bygget med **Next.js** (App Router), **React**, **Tailwind CSS**, **Zustand**, **Supabase** (auth + database) og **Stripe** (abonnement og valgfritt AI-tillegg).

**Merkevare:** Smart Budsjett · EnkelExcel

## Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) — forsiden er markedsføringslanding; appen krever innlogging og nås via f.eks. `/dashboard`.

Kopier [`.env.example`](./.env.example) til `.env.local` og fyll inn Supabase (og eventuelt Stripe, OpenAI, Finnhub) for full funksjon.

## Bygg

```bash
npm run build
npm start
```

## Dokumentasjon

Produkt, landing, pris, design og arkitektur er beskrevet i **[`docs/`](./docs/)**:

| Dokument | Beskrivelse |
|----------|-------------|
| [docs/README.md](./docs/README.md) | Indeks over alle dokumenter |
| [docs/PRODUKT.md](./docs/PRODUKT.md) | Produkt og målgruppe |
| [docs/LANDING.md](./docs/LANDING.md) | Landingsside-struktur (`/`, `/iris`) |
| [docs/PRIS-OG-ABONNEMENT.md](./docs/PRIS-OG-ABONNEMENT.md) | Priser, prøveperiode, Stripe og AI-tillegg |
| [docs/DESIGN.md](./docs/DESIGN.md) | UI-retningslinjer |
| [docs/INNHOLD.md](./docs/INNHOLD.md) | Tone og språk |
| [docs/ARKITEKTUR.md](./docs/ARKITEKTUR.md) | Stack, ruter, API, Supabase |
| [docs/A11Y.md](./docs/A11Y.md) | Tilgjengelighet |
| [docs/DESIGN-KILDER.md](./docs/DESIGN-KILDER.md) | Designkilder |
| [docs/DEMO.md](./docs/DEMO.md) | Demo-idéer (valgfritt) |

**Cursor (AI):** Regler for assistenten ligger i [`.cursor/rules/`](./.cursor/rules/) — bl.a. mobilvennlig UI (`mobile-responsive-ui.mdc`).

**Juridisk innhold** skal ligge på egne sider i appen:

- `/personvern` — [`src/app/personvern/page.tsx`](./src/app/personvern/page.tsx)
- `/vilkar` — [`src/app/vilkar/page.tsx`](./src/app/vilkar/page.tsx)

Oppdater disse med fulltekst når den er klar; `docs` oppsummerer ikke sensitive juridiske detaljer.
