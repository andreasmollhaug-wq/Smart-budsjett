import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import {
  markSubscriptionCanceled,
  upsertSubscriptionFromStripe,
} from '@/lib/stripe/syncSubscription'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    console.error('[stripe] webhook: mangler STRIPE_SECRET_KEY eller STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Webhook ikke konfigurert.' }, { status: 503 })
  }

  const admin = createServiceRoleClient()
  if (!admin) {
    console.error('[stripe] webhook: mangler SUPABASE_SERVICE_ROLE_KEY')
    return NextResponse.json({ error: 'Database ikke konfigurert for webhook.' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Mangler signatur.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe] webhook signature', err)
    return NextResponse.json({ error: 'Ugyldig signatur.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const subRef = session.subscription
        const subId = typeof subRef === 'string' ? subRef : subRef?.id
        if (!subId) break
        const subscription = await stripe.subscriptions.retrieve(subId)
        const fallbackUserId = session.client_reference_id ?? undefined
        await upsertSubscriptionFromStripe(admin, subscription, fallbackUserId)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripe(admin, subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await markSubscriptionCanceled(admin, subscription)
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[stripe] webhook handler', event.type, e)
    return NextResponse.json({ error: 'Webhook-behandling feilet.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
