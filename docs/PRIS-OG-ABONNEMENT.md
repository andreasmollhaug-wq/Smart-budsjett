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
- Abonnementsstatus leses i app fra Supabase; administrasjon for brukeren ligger under **`/konto/betalinger`** (Customer Portal / Checkout der det er implementert).

## Eksisterende kunder

Ved prisendring for aktive abonnement: vurder **varsel** og vilkår i henhold til avtale og gjeldende lov.
