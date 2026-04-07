import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Betalte fakturaer fra Stripe (abonnement + evt. engangskjøp som AI-kreditter samme kunde). */
export async function GET() {
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
    console.error('[stripe] invoices GET subscription', subErr)
    return NextResponse.json({ error: 'Kunne ikke hente kundedata.' }, { status: 500 })
  }

  const customerId = subRow?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ paidCount: 0, invoices: [] as unknown[] })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe er ikke konfigurert.' }, { status: 503 })
  }

  try {
    const list = await stripe.invoices.list({
      customer: customerId,
      status: 'paid',
      limit: 100,
    })

    const invoices = list.data.map((inv) => ({
      id: inv.id,
      /** Unix sekunder */
      created: inv.created,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      description: inv.description ?? null,
    }))

    return NextResponse.json({
      paidCount: invoices.length,
      invoices,
    })
  } catch (e) {
    console.error('[stripe] invoices.list', e)
    return NextResponse.json({ error: 'Kunne ikke hente fakturaer fra Stripe.' }, { status: 502 })
  }
}
