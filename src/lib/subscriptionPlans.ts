/** App og landing – felles pris-/tekstkonstanter (Stripe price IDs ligger i miljøvariabler). */
export const SOLO_PRICE_NOK = 89
export const FAMILY_PRICE_NOK = 139
export const SOLO_PRICE_LABEL = `${SOLO_PRICE_NOK} kr`
export const FAMILY_PRICE_LABEL = `${FAMILY_PRICE_NOK} kr`

export const subscriptionPlanCopy = {
  solo: {
    title: 'Solo',
    subtitle: 'For én person',
    price: SOLO_PRICE_LABEL,
    period: '/ måned',
  },
  family: {
    title: 'Familie',
    subtitle: 'For to eller flere i samme husholdning',
    price: FAMILY_PRICE_LABEL,
    period: '/ måned',
  },
} as const
