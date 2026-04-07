# Design og UI — Smart Budsjett

Målet er **samme visuelle uttrykk** på landing (`/`) og i appen: rolig, troverdig, «produkt», ikke flashy kampanjeuttrykk.

## Kilder i kode

- **Farger og tokens:** [`src/app/globals.css`](../src/app/globals.css) (`:root`)
- **App-navigasjon:** [`src/components/layout/AppShell.tsx`](../src/components/layout/AppShell.tsx) + [`SidebarContent.tsx`](../src/components/layout/SidebarContent.tsx)
- **Kort / oversikt:** [`src/components/ui/StatCard.tsx`](../src/components/ui/StatCard.tsx), dashboard m.fl.
- **Landing:** [`src/components/marketing/`](../src/components/marketing/)

## CSS-variabler (tokens)

Bruk disse variablene for bakgrunn, tekst og kort — ikke introduser nye hovedfarger uten å oppdatere `globals.css`:

| Variabel | Bruk |
|----------|------|
| `--bg` | Sidebakgrunn (lys blålilla) |
| `--surface` | Kort, paneler, headerflate |
| `--surface` + `border` | Kort med `1px solid var(--border)` |
| `--text` | Hovedtekst |
| `--text-muted` | Sekundærtekst, hjelpetekst |
| `--primary`, `--primary-light`, `--primary-pale` | Primær handling, highlights, lyse flater |
| `--accent` | Sekundær aksent (f.eks. scrollbar) |
| `--border` | Rammer og linjer |
| `--success`, `--warning`, `--danger` | Status, grafer, ikoner der det passer |

## Typografi

- **Font:** `Inter`, `system-ui`, sans-serif (satt på `body` i `globals.css`).
- Nye sider skal ikke skifte fontfamilie uten bevisst beslutning.

## Komponenter og mønstre

- **Kort:** Ofte `rounded-2xl`, `background: var(--surface)`, `border: 1px solid var(--border)`.
- **Primærknapp / CTA:** Gradient `linear-gradient(135deg, #3B5BDB, #4C6EF5)` med hvit tekst — samme som «SB»-badge i sidebar.
- **Sekundærknapp:** Lys bakgrunn (`--surface` eller `--bg`) + border, som i [`Header`](../src/components/layout/Header.tsx).
- **Ikoner:** [`lucide-react`](https://lucide.dev/) — ikoner i små sirkler med lav metning (`--primary-pale` eller farge + lav alfa), jf. StatCard.
- **Hero / dashboard:** Større gradientblokker kan bruke utvidet gradient med `#7048E8` der det allerede er brukt i appen (f.eks. dashboard-kort).

## Prinsipp

- **Enkelt og ryddig** — mye luft, tydelig hierarki.
- **Konsistens** — nye seksjoner skal ligne eksisterende kort og knapper, ikke nye «stiler per side».
