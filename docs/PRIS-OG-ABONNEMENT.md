# Pris og abonnement

Bruk denne filen som **referanse** når dere oppdaterer priser i kode ([`src/components/marketing/LandingPricing.tsx`](../src/components/marketing/LandingPricing.tsx)), betalingsleverandør og kundekommunikasjon.

**Ved prisendring:** oppdater både denne filen og `LandingPricing.tsx` (og eventuelt betalingsside under `/konto/betalinger`) slik at tall og tekst alltid samsvarer.

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

## Viktige FAQ-temaer (sjekkliste)

- Hvorfor kort ved start?
- Hva skjer når 14 dager er over?
- Hva menes med «familie» / antall brukere?
- Kan man bytte mellom Solo og Familie?
- Hvordan sier man opp?
- Hva skjer med data (peker til personvern)?

## Teknisk (per i dag)

- Ekte betalingsintegrasjon (f.eks. Stripe) og lagring av abonnementsstatus er **utenfor** ren landing — CTA kan peke til `/dashboard` eller senere `/registrer` / betalingslenke.

## Eksisterende kunder

Ved prisendring for aktive abonnement: vurder **varsel** og vilkår i henhold til avtale og gjeldende lov.
