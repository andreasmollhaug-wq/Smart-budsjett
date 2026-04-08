import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'
import type { BillingPlan } from '@/lib/stripe/plan'
import { subscriptionTrialPeriodDays } from '@/lib/stripe/trialPeriodDays'

export const dynamic = 'force-dynamic'

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY er ikke konfigurert.' },
      { status: 503 }
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

  const body = (await req.json().catch(() => null)) as { plan?: string } | null
  const plan = body?.plan as BillingPlan | undefined
  if (plan !== 'solo' && plan !== 'family') {
    return NextResponse.json({ error: 'Ugyldig plan (solo eller family).' }, { status: 400 })
  }

  const priceId =
    plan === 'solo' ? process.env.STRIPE_PRICE_SOLO : process.env.STRIPE_PRICE_FAMILY
  if (!priceId) {
    return NextResponse.json(
      { error: 'STRIPE_PRICE_SOLO / STRIPE_PRICE_FAMILY er ikke satt i miljøvariabler.' },
      { status: 503 }
    )
  }

  const base = appBaseUrl()
  const trialDays = subscriptionTrialPeriodDays()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      locale: 'nb',
      payment_method_collection: 'always',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/konto/betalinger?checkout=success`,
      cancel_url: `${base}/konto/betalinger?checkout=canceled`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
        ...(trialDays != null ? { trial_period_days: trialDays } : {}),
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Kunne ikke opprette Checkout-økt.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[stripe] checkout.sessions.create', e)
    return NextResponse.json({ error: 'Stripe-feil ved opprettelse av betaling.' }, { status: 500 })
  }
}
