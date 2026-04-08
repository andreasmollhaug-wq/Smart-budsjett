import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

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

  const { data: subRow, error: subErr } = await supabase
    .from('user_subscription')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subErr) {
    console.error('[stripe] billing-portal subscription', subErr)
    return NextResponse.json({ error: 'Kunne ikke hente abonnementsdata.' }, { status: 500 })
  }

  const customerId = subRow?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json(
      {
        error:
          'Ingen Stripe-kunde funnet. Fullfør et abonnement via knappene under først, så kan du administrere det her.',
      },
      { status: 400 },
    )
  }

  const base = appBaseUrl()
  const returnUrl = `${base}/konto/betalinger`

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      /** Norsk bokmål — ellers følger Stripe nettleser (ofte engelsk). */
      locale: 'nb',
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Kunne ikke opprette kundeportal-økt.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[stripe] billingPortal.sessions.create', e)
    return NextResponse.json(
      { error: 'Kunne ikke åpne Stripe kundeportal. Prøv igjen senere.' },
      { status: 500 },
    )
  }
}
