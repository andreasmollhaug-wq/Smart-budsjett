# Pris og abonnement

Bruk denne filen som **referanse** når dere oppdaterer priser i kode ([`src/components/marketing/LandingPricing.tsx`](../src/components/marketing/LandingPricing.tsx)), Stripe-produkter og kundekommunikasjon.

**Ved prisendring:** oppdater både denne filen, `LandingPricing.tsx` og Stripe Dashboard (price IDs i miljøvariabler) slik at tall og tekst samsvarer.

## Planer og priser (gjeldende målsetning)

| Plan | Pris | Målgruppe |
|------|------|-----------|
| **Solo** | **89 kr / måned** | Én person — én brukerkonto |
| **Familie** | **139 kr / måned** | To eller flere i **samme husholdning** («Mest valgt» i UI) |

Funksjonelt innhold i appen kan være likt på begge planer; **forskjellen** er antall brukere / husholdning (i landing-tekst: bl.a. opptil fem brukere for Familie). Juster tekst i app og FAQ hvis policy endres.

## Prøveperiode

- **14 dagers gratis prøveperiode** på alle planer.
- **Betalingskort** registreres **ved oppstart** av prøveperioden.
- Formulering til kunde: vær **tydelige** på at kort kreves, og at faktisk trekk skjer **etter** prøveperioden (presiser når betalingsflyt og vilkår er endelige).

## EnkelExcel AI — kvote og tillegg

- **Månedlig kvote** for AI-meldinger per bruker (kalendermåned, Europe/Oslo). Standardgrense kan overstyres med miljøvariabel — se [`.env.example`](../.env.example) (`AI_MONTHLY_MESSAGE_LIMIT`).
- **Bonus-meldinger:** brukere kan kjøpe ekstra meldinger via Stripe (engangsbetaling). Kreditter lagres i databasen og brukes når månedskvoten er brukt opp. Pris vist i UI kan justeres (`NEXT_PUBLIC_AI_BONUS_PRICE_NOK`); produkt/pris-ID i Stripe må matche (`STRIPE_PRICE_AI_CREDITS_*`).
- AI er et **hjelpeverktøy** (automatiserte svar), ikke personlig rådgivning — se landing og app-tekst.

## Viktige FAQ-temaer (sjekkliste)

- Hvorfor kort ved start?
- Hva skjer når 14 dager er over?
- Hva menes med «familie» / antall brukere?
- Kan man bytte mellom Solo og Familie?
- Hvordan sier man opp?
- Hva skjer med data (peker til personvern)?
- Hvordan fungerer AI-kvote og eventuelle tilleggskjøp?

## Teknisk (Stripe og Supabase)

- **Stripe Checkout** opprettes fra API-ruter under [`src/app/api/stripe/`](../src/app/api/stripe/) (abonnement og AI-kreditter).
- **Webhook** ([`stripe/webhook`](../src/app/api/stripe/webhook/route.ts)) oppdaterer bl.a. tabellen `user_subscription` (plan, status, periode) og behandler fullførte AI-kreditkjøp. Krever `SUPABASE_SERVICE_ROLE_KEY` og Stripe-signatur.
- Abonnementsstatus leses i app fra Supabase; betaling starter via **Stripe Checkout** fra **`/konto/betalinger`**. Selvbetjent administrasjon (kort, oppsigelse) skjer via **Stripe Customer Portal**, åpnet fra knappen «Administrer abonnement» (API: `stripe/billing-portal`). Stripe Dashboard må ha Customer portal aktivert.

### Tilgangskontroll (kort før prøveperiode)

- **`user_subscription.status`**: Stripe bruker typisk `active`, `trialing`, `past_due` (grace). Statusen **`legacy_grandfathered`** settes **kun** i databasen (engangsmigrering) for brukere som allerede var registrert uten betaling — de beholder full tilgang uten ny Checkout.
- **RLS** ([`supabase/migrations/007_subscription_gate.sql`](../supabase/migrations/007_subscription_gate.sql)): funksjonen `user_has_app_write_access()` styrer insert/update på bl.a. `user_app_state`, roadmap-stemmer og sikrer AI-RPC-er. Uten gyldig status kan ikke økonomidata persisteres.
- **Middleware** ([`src/middleware.ts`](../src/middleware.ts)): når `SUBSCRIPTION_ENFORCEMENT_ENABLED=true`, redirectes brukere uten tilgang fra app-sider til `/konto/betalinger` (unntak: `/konto/**` og `/api/**`). API-ruter som allerede bruker `subscriptionForbiddenUnlessAccess` returnerer 403.

#### Utrulling (anbefalt rekkefølge)

1. Deploy applikasjonskode som forstår `legacy_grandfathered`.
2. Kjør migrasjon `007_subscription_gate.sql` i Supabase (bestefar + RLS).
3. Sett `SUBSCRIPTION_ENFORCEMENT_ENABLED=true` i hosting-miljøet.

#### Rollback (nødhjelp)

1. Sett `SUBSCRIPTION_ENFORCEMENT_ENABLED=false` (fjerner redirect og API-403 der det sjekkes).
2. Gjenopprett tidligere RLS på `user_app_state` (og evt. roadmap) ved å kjøre SQL som dropper nye policies og gjenoppretter de fra [`001_user_app_state.sql`](../supabase/migrations/001_user_app_state.sql) / [`003_feature_roadmap.sql`](../supabase/migrations/003_feature_roadmap.sql), og dropper `user_has_app_write_access()` hvis den ikke lenger brukes. Rader med `legacy_grandfathered` kan stå igjen uten å skade.

## Eksisterende kunder

Ved prisendring for aktive abonnement: vurder **varsel** og vilkår i henhold til avtale og gjeldende lov.
