import Stripe from 'stripe'

/** Strukturert serverlogg for Stripe API-feil (Vercel) — ikke kortdata. */
export function logStripeError(context: string, e: unknown): void {
  if (e instanceof Stripe.errors.StripeError) {
    console.error(context, {
      type: e.type,
      code: e.code,
      message: e.message,
      statusCode: e.statusCode,
      requestId: e.requestId,
      param: e.param,
    })
    return
  }
  console.error(context, e)
}

export function stripeRequestIdFromError(e: unknown): string | undefined {
  if (e instanceof Stripe.errors.StripeError && e.requestId) {
    return e.requestId
  }
  return undefined
}
