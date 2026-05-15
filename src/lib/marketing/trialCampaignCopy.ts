/**
 * Markedsføring av prøve-kampanje — hold i tråd med STRIPE_TRIAL_END_DATE i miljø (siste inkluderte dag).
 * Oppdater denne filen når kampanjen endres eller avsluttes.
 *
 * Viktig for drift: `TRIAL_CAMPAIGN_END_LABEL` / tekstene under må samsvare med
 * `STRIPE_TRIAL_END_DATE` i Vercel (f.eks. 30. juni 2026 ↔ YYYY-MM-DD `2026-06-30`).
 * Uten samsvar kan kunder få annen prøvelengde i Stripe enn det som loves i UI.
 */
export const TRIAL_CAMPAIGN_END_LABEL = '30. juni 2026'

/** Kort overskrift / badge */
export const TRIAL_OFFER_HEADLINE = `Gratis til ${TRIAL_CAMPAIGN_END_LABEL}`

/** Forklaring: ordinær 14 dager vs utvidet tilbud */
export const TRIAL_OFFER_EXTENDED_EXPLANATION =
  `Ordinært har vi 14 dagers gratis prøveperiode. Vi har utvidet tilbudet — det er nå gratis til ${TRIAL_CAMPAIGN_END_LABEL}.`

/** Kort linje til meta, Open Graph og komprimerte blokker */
export const TRIAL_OFFER_META_LINE = `${TRIAL_OFFER_HEADLINE}. Ordinært 14 dagers prøve; vi har utvidet tilbudet.`
