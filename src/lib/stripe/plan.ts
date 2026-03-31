export type BillingPlan = 'solo' | 'family'

export function planFromStripePriceId(priceId: string | undefined): BillingPlan | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_SOLO) return 'solo'
  if (priceId === process.env.STRIPE_PRICE_FAMILY) return 'family'
  return null
}
