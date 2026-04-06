# Demo — mulig neste steg

Dette er **ikke** en implementasjonskrav; filen dokumenterer idéer for å la besøkende oppleve produktet uten full betalingsflyt.

## Formål

Gi **inntrykk av grensesnittet** og verdiforslaget — eventuelt som supplement til 14-dagers prøve med kort.

## Mulige varianter

1. **Statisk demo på landing** — Utvidet «produktglimt» med skjermbilder eller enkel animasjon (lav kostnad).
2. **Interaktiv `/demo`** — Egen rute med **forhåndsutfylt demo-data** i state (f.eks. Zustand), banner «Du ser demo-data», uten lagring til ekte konto.
3. **Video** — Kort skjermopptak eller Loom (lav teknisk risiko).

## Merknad

En interaktiv demo krever vedlikehold når UI endres. Vurder **én tydelig demo-flyt** (f.eks. oversikt + budsjett) for å holde kostnaden nede.

**I appen i dag:** innloggede brukere kan slå på **demo-data** i innstillinger (`demoDataEnabled` i [`store.ts`](../src/lib/store.ts)) for å utforske grensesnittet med eksempeltall — dette er ikke det samme som en offentlig `/demo`-landing, men dekker delvis behovet for «prøv uten egne tall».
