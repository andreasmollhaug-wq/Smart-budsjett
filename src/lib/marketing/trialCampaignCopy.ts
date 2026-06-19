/**
 * Markedsføring av gratis prøveperiode — hold i tråd med prøvelengden i drift.
 *
 * Nå tilbys ordinær gratis prøveperiode (STRIPE_SUBSCRIPTION_TRIAL_DAYS, default 14 dager).
 * Den tidligere datostyrte kampanjen «Gratis til 30. juni 2026» (STRIPE_TRIAL_END_DATE) er avsluttet.
 *
 * Viktig for drift:
 * - Sørg for at `STRIPE_TRIAL_END_DATE` IKKE er satt i Vercel (ellers overstyres 14-dagers prøven av kampanje-datoen).
 * - Hvis `TRIAL_PERIOD_DAYS` endres her, må `STRIPE_SUBSCRIPTION_TRIAL_DAYS` i drift samsvare,
 *   ellers kan kunder få annen prøvelengde i Stripe enn det som loves i UI.
 */
export const TRIAL_PERIOD_DAYS = 14

/** Kort overskrift / badge */
export const TRIAL_OFFER_HEADLINE = `${TRIAL_PERIOD_DAYS} dager gratis prøveperiode`

/** Forklaring av prøvetilbudet */
export const TRIAL_OFFER_EXTENDED_EXPLANATION =
  `Du får full tilgang gratis i ${TRIAL_PERIOD_DAYS} dager på alle planer.`

/** Kort linje til meta, Open Graph og komprimerte blokker */
export const TRIAL_OFFER_META_LINE = `${TRIAL_PERIOD_DAYS} dagers gratis prøveperiode på alle planer.`
