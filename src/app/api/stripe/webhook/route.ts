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
        if (session.mode === 'payment') {
          const meta = session.metadata ?? {}
          if (meta.type === 'ai_bonus_credits' && session.payment_status === 'paid') {
            const userId = meta.supabase_user_id ?? session.client_reference_id
            const credits = parseInt(meta.credits_amount ?? '100', 10)
            if (userId && Number.isFinite(credits) && credits > 0) {
              const { error: rpcErr } = await admin.rpc('complete_ai_credit_purchase_from_stripe', {
                p_session_id: session.id,
                p_user_id: userId,
                p_amount: credits,
              })
              if (rpcErr) {
                console.error('[stripe] complete_ai_credit_purchase_from_stripe', rpcErr)
                throw rpcErr
              }
            }
          }
          break
        }
        if (session.mode !== 'subscription') break
        const subRef = session.subscription
        const subId = typeof subRef === 'string' ? subRef : subRef?.id
        if (!subId) break
        const subscription = await stripe.subscriptions.retrieve(subId, {
          expand: ['items.data.price'],
        })
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
    const detail =
      e && typeof e === 'object' && 'message' in e
        ? String((e as { message: unknown }).message)
        : String(e)
    console.error('[stripe] webhook handler', event.type, detail, e)
    return NextResponse.json({ error: 'Webhook-behandling feilet.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
