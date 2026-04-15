import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBonusPackCredits } from '@/lib/aiUsage'
import { logStripeError, stripeRequestIdFromError } from '@/lib/stripe/stripeErrorDetails'
import { getStripe } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function POST() {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY er ikke konfigurert.' },
      { status: 503 },
    )
  }

  const priceId = process.env.STRIPE_PRICE_AI_CREDITS_100
  if (!priceId) {
    return NextResponse.json(
      { error: 'STRIPE_PRICE_AI_CREDITS_100 er ikke satt i miljøvariabler.' },
      { status: 503 },
    )
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: 'Serverkonfigurasjon mangler.' }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const credits = getBonusPackCredits()
  const base = appBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'nb',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/enkelexcel-ai?ai_credits=success`,
      cancel_url: `${base}/enkelexcel-ai?ai_credits=canceled`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        type: 'ai_bonus_credits',
        supabase_user_id: user.id,
        credits_amount: String(credits),
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Kunne ikke opprette Checkout-økt.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    logStripeError('[stripe] ai-credits checkout.sessions.create', e)
    const requestId = stripeRequestIdFromError(e)
    return NextResponse.json(
      {
        error: 'Stripe-feil ved opprettelse av betaling.',
        ...(requestId ? { stripeRequestId: requestId } : {}),
      },
      { status: 500 },
    )
  }
}
